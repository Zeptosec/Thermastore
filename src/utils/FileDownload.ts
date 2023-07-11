import axios, { AxiosProgressEvent, AxiosResponse } from "axios";
import { Dispatch, SetStateAction } from "react";
import { Endpoint, getEndpoint } from "./FileUploader";
import { DirFile, endPoints } from "./FileFunctions";

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
 * Gets the earliest responding endpoint for faster load time.
 * @param endpts endpoints list.
 * @param predicate predicate for condition if endpoint is alive or not
 * @returns Endpoint that fastest responded to the request.
 */
export async function getEarliestEnd(endpts: Endpoint[], predicate: (rs: Response) => Promise<boolean>) {
    const abortController = new AbortController();
    let reqs: Promise<Endpoint>[] = [];
    let failCnt = 0;
    endpts.forEach(el => {
        reqs.push(
            new Promise(async (resolve, reject) => {
                try {
                    const rs = await fetch(el.link, { signal: abortController.signal });
                    if (await predicate(rs)) {
                        resolve(el);
                    } else {
                        throw Error("Response not ok with " + el.link)
                    }
                } catch (err: any) {
                    console.log(err);
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
export async function getFileData(fid: string, channel_id: string, setError: Dispatch<SetStateAction<string>> | null = null) {
    let data = null;
    let endpoint = await getEarliestEnd(endPoints, async (rs) => rs.status === 200);
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

export async function getImageHref(file: DownloadStatus, chanId: string) {
    checkEndpoints();

    const { chunkIndex, data, arrayIndex } = await downloadChunk(file.chunks[0], chanId, 0, 0, file);
    let dwnFile = new Blob([data]);
    const href = URL.createObjectURL(dwnFile);
    return href;
}

export async function getImage(cid: string, fid: string) {
    const data = await getFileData(fid, cid);
    return await getImageHref(data, cid);
}

/**
 * Gets the preview image data and returns it as url object. You must manage url object yourself with URL.revokeObjectUrl to free memory. Sad but no other way around it.
 * @param file File with preview id
 * @throws Will throw an error if file has no preview
 * @returns Object url that can be used directly in element to display the image.
 */
export async function getImagePreviewHref(file: DirFile): Promise<string> {
    if (!file.previews) throw Error("File has no previews");
    checkEndpoints();
    const { data } = await downloadChunk(file.previews.fileid, file.chanid, 0, 0);
    let dwnFile = new Blob([data]);
    return URL.createObjectURL(dwnFile);
}

export async function downloadFileChunks(file: DownloadStatus, setFile?: Dispatch<SetStateAction<DownloadStatus>>, onStart: Function | null = null, onFinished: Function | null = null) {
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

async function checkEndpoints(setFile?: Dispatch<SetStateAction<DownloadStatus>>) {
    //check if current endpoints are working
    for (let i = 0; i < workingEnds.length; i++) {
        try {
            const rs = await fetch(workingEnds[i].link)
            if (!rs.ok) workingEnds.splice(i, 1)
        } catch (err) {
            console.log(err);
        }
    }
    let cnt = endPoints.length;
    for (let i = 0; i < endPoints.length; i++) {
        (async () => {
            try {
                const rs = await fetch(endPoints[i].link)
                if (rs.ok) {
                    if (!workingEnds.includes(endPoints[i]))
                        workingEnds.push(endPoints[i]);
                }
            } catch (err: any) {
                console.log(err);
                cnt -= 1;
                if (cnt === 0 && setFile) {
                    setFile(w => ({ ...w, failed_text: "No services left! Check console!" }))
                    console.log("Download proxy streamer https://github.com/Zeptosec/Streamer to use for downloading. Just start it on your computer and try downloading again.")
                }
            }
        })();
    }
}

export async function downloadFile(file: DownloadStatus, setFile?: Dispatch<SetStateAction<DownloadStatus>>, onStart: Function | null = null, onFinished: Function | null = null) {
    // check every 100s maybe localhost appeared or other services came up, or shutdown just cleanup.
    const int = setInterval(() => checkEndpoints(setFile), 100 * 1000);
    checkEndpoints(setFile);
    if (setFile) setFile(w => ({ ...w, finished: false }));
    const chunks = await downloadFileChunks(file, setFile, onStart, onFinished);
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