import axios, { AxiosProgressEvent, AxiosResponse } from "axios";
import { Dispatch, SetStateAction } from "react";
import { Endpoint, getEndpoint } from "./FileUploader";
import { DirFile } from "./FileFunctions";

export interface DownloadStatus {
    timeleft: number,
    speed: number,
    downloadedBytes: number,
    name: string,
    size: number,
    chunks: Array<string>,
    precentage: number,
    channel_id: string,
    fid?: string,
    started_at: number,
    failed_text?: string,
    finished?: boolean
}

const maxConns = 10;

let workingEnds: Endpoint[] = []

/**
 * Test if endpoint is awake and working
 * @param endPoint Endpoint to test
 * @param abortController Controller to stop the test
 * @param predicate Predicate for custom test
 * @returns true if passed the test
 */
async function TestEndpoint(endPoint: Endpoint, abortController?: AbortController): Promise<boolean> {
    try {
        const rs = await fetch(endPoint.link, { signal: abortController?.signal });
        const json = await rs.text();
        if (rs.ok && json.startsWith('Alive')) {
            return true;
        }
    } catch (err) {
        console.log(err);
    }
    return false;
}

/**
 * Gets the earliest responding endpoint for faster load time.
 * @param endpts endpoints list.
 * @param predicate predicate for condition if endpoint is alive or not
 * @returns Endpoint that fastest responded to the request.
 */
export async function getEarliestEnd(endPoints: Endpoint[]): Promise<Endpoint> {
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), 8000);
    const localEndPoint = endPoints[endPoints.length - 1];
    // try to prioritize localhost
    if (await TestEndpoint(localEndPoint, abortController)) {
        return localEndPoint;
    }

    const endpts = endPoints.slice(0, -1);
    if (endpts.length === 0) return localEndPoint;
    let reqs: Promise<Endpoint>[] = [];
    let failCnt = 0;
    endpts.forEach(el => {
        reqs.push(
            new Promise(async (resolve, reject) => {
                if (await TestEndpoint(el, abortController)) {
                    resolve(el);
                } else {
                    failCnt++;
                    if (failCnt === endpts.length) {
                        // if all rejected then return last one rejected to not get stuck on Promise.any
                        resolve(el)
                    }
                }
            })
        )
    })

    const endpt = await Promise.any(reqs);
    abortController.abort();
    return endpt;
}

/**
 * 
 * @param fid File id
 * @param channel_id
  Channel id
 * @param setError Function to set error text
 * @returns Data with other file ids and order
 */
export async function getFileData(fid: string, channel_id: string, endPoints: Endpoint[], setError: Dispatch<SetStateAction<string>> | null = null) {
    let data = null;
    let endpoint = await getEarliestEnd(endPoints);
    endpoint.occupied += 1;
    let failCnt = 0;
    while (!data && failCnt < 5) {
        try {
            const res: AxiosResponse = await axios.get(`${endpoint.link}/down/${channel_id
                }/${fid}`);
            data = res.data;
            if (!data.size || !data.name || !data.chunks) {
                failCnt = 1000;
                data = null;
                throw Error("File not found");
            }
            if (setError)
                setError("");
        } catch (err: any) {
            if (setError) {
                if (err.request.status)
                    setError("File not found");
            }
            console.log(err);
            failCnt++;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    endpoint.occupied -= 1;

    return data;
}

async function downloadChunk(chunkId: string, chanId: string, arrayIndex: number, chunkIndex: number, downStatus?: DownloadStatus) {
    let data = null;
    while (!data) {
        console.log(workingEnds);
        const endpoint = await getEndpoint(workingEnds, maxConns);
        endpoint.occupied += 1;
        try {
            let prev = 0;
            const res = await axios.get(`${endpoint.link}/down/${chanId}/${chunkId}`, {
                onDownloadProgress: (w: AxiosProgressEvent) => {
                    if (!downStatus) return;
                    const diff = w.loaded - prev;
                    prev = w.loaded;
                    downStatus.downloadedBytes += diff;
                },
                responseType: 'blob'
            });
            data = res.data;
        } catch (err) {
            console.log(err);
            await new Promise(r => setTimeout(r, 1000));
        } finally {
            endpoint.occupied -= 1;
        }
    }

    return { arrayIndex, data, chunkIndex };
}

export function downloadBlob(file: Blob, name: string) {
    const href = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);
}

export async function getImageHref(file: DownloadStatus, chanId: string, endPoints: Endpoint[]) {
    checkEndpoints(endPoints);

    const { chunkIndex, data, arrayIndex } = await downloadChunk(file.chunks[0], chanId, 0, 0, file);
    let dwnFile = new Blob([data]);
    const href = URL.createObjectURL(dwnFile);
    return href;
}

export async function getImage(cid: string, fid: string, endPoints: Endpoint[]) {
    const data = await getFileData(fid, cid, endPoints);
    return await getImageHref(data, cid, endPoints);
}

/**
 * Gets the preview image data and returns it as url object. You must manage url object yourself with URL.revokeObjectUrl to free memory. Sad but no other way around it.
 * @param file File with preview id
 * @throws Will throw an error if file has no preview
 * @returns Object url that can be used directly in element to display the image.
 */
export async function getImagePreviewHref(file: DirFile, endPoints: Endpoint[]): Promise<string> {
    if (!file.previews) throw Error("File has no previews");
    checkEndpoints(endPoints);
    const { data } = await downloadChunk(file.previews.fileid, file.chanid, 0, 0);
    let dwnFile = new Blob([data]);
    return URL.createObjectURL(dwnFile);
}

export async function downloadFileChunks(file: DownloadStatus, endPoints: Endpoint[], setFile?: Dispatch<SetStateAction<DownloadStatus>>, onStart: Function | null = null, onFinished: Function | null = null) {
    if (onStart) onStart();
    let speeds: Array<number> = [];
    let prevTime = Date.now();
    let prevLoaded = 0;
    let i = 0;
    const interval = setInterval(() => {
        speeds[i] = (file.downloadedBytes - prevLoaded) / (Date.now() - prevTime) * 1000;
        const speed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const timeleft = speed === 0 ? -1 : (file.size - file.downloadedBytes) / speed;
        const precentage = file.downloadedBytes / file.size
        if (setFile) {
            setFile(w => ({
                ...w,
                speed,
                timeleft,
                precentage,
                downloadedBytes: file.downloadedBytes
            }));
        } else {
            file.speed = speed;
            file.timeleft = timeleft;
            file.precentage = precentage;
        }
        prevLoaded = file.downloadedBytes;
        prevTime = Date.now();
        i = (i + 1) % 8;
    }, 1000);

    let chunks: Array<any> = [];
    let promises: Array<Promise<{ chunkIndex: number, data: any, arrayIndex: number }>> = [];

    for (let i = 0; i < file.chunks.length; i++) {
        let ind = i;

        if (promises.length >= maxConns * endPoints.length) {
            const { chunkIndex, data, arrayIndex } = await Promise.any(promises);
            chunks[chunkIndex] = data;
            ind = arrayIndex;
        }
        promises[ind] = downloadChunk(file.chunks[i], file.channel_id
            , ind, i, file);
    }
    (await Promise.all(promises)).forEach(w => chunks[w.chunkIndex] = w.data);
    clearInterval(interval);
    if (onFinished) onFinished();
    return chunks;
}

async function checkEndpoints(endPts: Endpoint[], setFile?: Dispatch<SetStateAction<DownloadStatus>>) {
    //check if current endpoints are working
    for (let i = 0; i < workingEnds.length; i++) {
        try {
            const rs = await fetch(workingEnds[i].link)
            if (!rs.ok) workingEnds.splice(i, 1)
        } catch (err) {
            console.log(err);
        }
    }
    const localEnd = endPts[endPts.length - 1];
    if (await TestEndpoint(localEnd)) {
        while (workingEnds.length > 0) workingEnds.pop();
        workingEnds.push(localEnd);
        console.log(workingEnds);
        return;
    }
    const endPoints = endPts.slice(0, -1);
    let cnt = endPoints.length;
    for (let i = 0; i < endPoints.length; i++) {
        if (workingEnds.includes(endPoints[i])) continue;
        (async () => {
            if (await TestEndpoint(endPoints[i])) {
                workingEnds.push(endPoints[i]);
            } else {
                cnt -= 1;
                if (cnt === 0) {
                    if (setFile)
                        setFile(w => ({ ...w, failed_text: "No services left! Check console!" }))
                    console.log("Download proxy streamer https://github.com/Zeptosec/Streamer to use for downloading. Just start it on your computer and try downloading again.")
                }
            }
        })();
    }
}

export async function downloadFile(file: DownloadStatus, endPoints: Endpoint[], setFile?: Dispatch<SetStateAction<DownloadStatus>>, onStart: Function | null = null, onFinished: Function | null = null) {
    // check every 100s maybe localhost appeared or other services came up, or shutdown just cleanup.
    const int = setInterval(() => checkEndpoints(endPoints, setFile), 100 * 1000);
    checkEndpoints(endPoints, setFile);
    if (setFile) setFile(w => ({ ...w, finished: false }));
    const chunks = await downloadFileChunks(file, endPoints, setFile, onStart, onFinished);
    clearInterval(int);
    let dwnFile = new Blob(chunks);
    if (setFile) {
        setFile(w => ({
            ...w,
            precentage: 1,
            downloadedBytes: file.size,
            timeleft: 0,
            finished: true
        }))
    } else {
        file.precentage = 1;
        file.downloadedBytes = file.size;
        file.timeleft = 0;
    }
    downloadBlob(dwnFile, file.name);
}