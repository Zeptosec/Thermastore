import axios, { AxiosProgressEvent, AxiosResponse } from "axios";
import { Dispatch, SetStateAction } from "react";
import { Endpoint, getEndpoint } from "./FileUploader";

export interface DownloadStatus {
    timeleft: number,
    speed: number,
    downloadedBytes: number,
    name: string,
    size: number,
    chunks: Array<number>,
    precentage: number,
}

const maxConns = 10;
let endPoints: Array<Endpoint> = [{
    link: 'https://thermoxy.onrender.com',
    occupied: 0
}];

export async function getFileData(id: string, setError: Dispatch<SetStateAction<string>> | null = null) {
    let data = null;
    let endpoint = await getEndpoint(endPoints, maxConns);
    endpoint.occupied += 1;
    let failCnt = 0;
    while (!data && failCnt < 5) {
        try {
            const res: AxiosResponse = await axios.get(`${endpoint.link}/${id}`);
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
                if(err.request.status)
                setError("File not found");
            }
            console.log(err);
            failCnt++;
            await new Promise(r => setTimeout(r, 1000));
        } finally {
            endpoint.occupied -= 1;
        }
    }
    return data;
}

async function downloadChunk(chunkId: number, arrayIndex: number, chunkIndex: number, downStatus: DownloadStatus) {
    let data = null;
    while (!data) {
        const endpoint = await getEndpoint(endPoints, maxConns);
        endpoint.occupied += 1;

        try {
            let prev = 0;
            const res = await axios.get(`${endpoint.link}/${chunkId}`, {
                onDownloadProgress: (w: AxiosProgressEvent) => {
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

export async function downloadFileChunks(file: DownloadStatus, setFile: Dispatch<SetStateAction<DownloadStatus>>, onStart: Function | null = null, onFinished: Function | null = null) {
    if(onStart) onStart();
    let speeds: Array<number> = [];
    let prevTime = Date.now();
    let prevLoaded = 0;
    let i = 0;
    const interval = setInterval(() => {
        speeds[i] = (file.downloadedBytes - prevLoaded) / (Date.now() - prevTime) * 1000;
        const speed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const timeleft = (file.size - file.downloadedBytes) / speed;
        const precentage = file.downloadedBytes / file.size
        console.log(speeds);
        console.log(speed);
        setFile(w => ({
            ...w,
            speed,
            timeleft,
            precentage,
            downloadedBytes: file.downloadedBytes
        }));
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
        promises[ind] = downloadChunk(file.chunks[i], ind, i, file);
    }
    (await Promise.all(promises)).forEach(w => chunks[w.chunkIndex] = w.data);
    clearInterval(interval);
    if(onFinished) onFinished();
    return chunks;
}

export async function downloadFile(file: DownloadStatus, setFile: Dispatch<SetStateAction<DownloadStatus>>, onStart: Function | null = null, onFinished: Function | null = null) {
    const chunks = await downloadFileChunks(file, setFile, onStart, onFinished);
    let dwnFile = new Blob(chunks);
    setFile(w=> ({
        ...w,
        precentage: 1,
        downloadedBytes: file.size,
        timeleft: 0
    }))
    downloadBlob(dwnFile, file.name);
}