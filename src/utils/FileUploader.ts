import axios from "axios";
import { downloadBlob } from "./FileDownload";
import { chunkSize } from "./FileFunctions";
import { supabase } from "./Supabase";
export interface FileStatus {
    file: File,
    uploadedBytes: number,
    uploadedParts: Array<number>,
    errorText: string,
    finished: boolean,
    link: string,
    totalPartsCount: number,
    uploadedPartsCount: number,
    speed: number, // bytes/sec
    timeleft: number, // seconds
}

export interface Endpoint {
    link: string,
    occupied: number,
    isHook?: boolean,
    errCount?: number,
    chunkSize?: number
}
let dook: Endpoint | null = null;

const uploadEndPoints: Array<Endpoint> = [
    {
        link: 'https://thermostore.onrender.com/api/upload',
        occupied: 0
    },
    {
        link: 'https://spangle-curly-seaplane.glitch.me/api/upload',
        occupied: 0
    },
    {
        link: 'https://receptive-large-tennis.glitch.me/api/upload',
        occupied: 0
    }];
let chunkQueue: Array<Promise<number>> = [];
const maxQueueSize = 10;
let filesToUpload: Array<FileStatus> = []

export async function getEndpoint(endPoints: Array<Endpoint>, maxSize: number) {
    while (true) {
        let endPt = endPoints.filter(w => w.occupied < maxSize);
        if (endPt.length === 0) {
            await new Promise(r => setTimeout(r, 1000));
        } else {
            return endPt[Math.floor(Math.random() * endPt.length)];
        }
    }
}

/**
 * A function which uploads chunk to server. It is weird because it is more like two functions.
 * @param chunk chunk to upload
 * @returns the id of uploaded chunk
 */
async function uploadChunkNoStatus(chunk: Blob) {
    var data = new FormData();
    data.append('file', chunk);
    let json = null;
    // to comply with reservation system.
    const { index, endpoint } = await getReservedSlot();
    chunkQueue[index] = (async () => {
        while (json === null)
            await new Promise(r => setTimeout(r, 1000));
        return index;
    })()
    // to upload file.
    while (json === null) {
        try {
            const res = await axios.post(endpoint.link, data);
            if (endpoint.isHook) {
                json = { fileid: res.data.attachments[0].id }
            } else
                json = res.data;
        } catch (err: any) {
            console.log(err);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return json.fileid as number;
}

async function uploadChunk(chunk: Blob, file: FileStatus, qindex: number, endpoint: Endpoint, partIndex: number, interval: NodeJS.Timer, user: boolean) {
    var data = new FormData();
    data.append('file', chunk);
    let prevLoaded = 0;
    let json = null;
    while (json === null) {
        try {
            const res = await axios.post(endpoint.link, data, {
                onUploadProgress: function (event) {
                    // for small files on fast internet otherwise overshoots
                    let loaded = Math.min(event.loaded, chunk.size);
                    file.uploadedBytes += loaded - prevLoaded;

                    prevLoaded = loaded;
                    file.errorText = "";
                }
            })
            if (endpoint.isHook) {
                json = { fileid: res.data.attachments[0].id }
            } else
                json = res.data;
        } catch (err: any) {
            if (endpoint.isHook && endpoint.errCount) {
                endpoint.errCount += 1;
                if (endpoint.errCount >= 10) {
                    dook = null;
                    console.log("abandoning hook because it gives too many errors");
                }
            }
            console.log(err);
            file.errorText = err.message;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    // release resources for others to use
    endpoint.occupied -= 1;
    file.errorText = "";
    if (json.fileid) {
        file.uploadedPartsCount += 1;
        file.uploadedParts[partIndex] = json.fileid;
    } else {
        console.error("missing fileid");
        console.error(json);
    }
    // last part of file finished
    if (file.uploadedPartsCount === file.totalPartsCount) {
        const str = JSON.stringify({
            name: file.file.name,
            size: file.file.size,
            chunks: file.uploadedParts
        });
        const filedata = new Blob([str], { type: 'text/plain' });
        if (filedata.size > chunkSize) {
            // hopefully it will never come to this
            console.log("file data file was too big");
            file.errorText = "File data file was too big";
            downloadBlob(filedata, "fileids.txt");
        } else {
            const fdataid = await uploadChunkNoStatus(filedata);
            //console.log(`fdataid: ${fdataid}`);
            if (user) {
                const { error } = await supabase
                    .from('files')
                    .insert({
                        name: file.file.name,
                        size: file.file.size,
                        data: fdataid
                    });
                if (error) {
                    console.error(error);
                }
            }
            file.link = "/download/" + fdataid;
        }

        file.finished = true;
        clearInterval(interval);
        //upload to supabase or some shit
    }
    return qindex;
}

async function getReservedSlot() {
    let endpoint;
    if (dook) {
        let index = -1;
        if (chunkQueue.length >= 5)
            index = await Promise.any(chunkQueue);
        await new Promise(r => setTimeout(r, 400)); // wait because limit is 5 per 2 sec
        endpoint = dook;
        if (index !== -1) {
            return { index, endpoint };
        }
    } else
        endpoint = await getEndpoint(uploadEndPoints, maxQueueSize);

    if (chunkQueue.length >= maxQueueSize * uploadEndPoints.length) {
        const index = await Promise.any(chunkQueue);
        return { index, endpoint };
    } else {
        return { index: chunkQueue.length, endpoint }
    }
}

async function uploadFile(file: FileStatus, user: boolean) {
    let filesize = file.file.size;
    console.log(user);
    if (!user && filesize > 250 * 1024 ** 2) {
        file.errorText = "File size limit 250MB when not logged in";
        file.finished = true;
        return;
    }
    if (user && filesize > 1024 ** 4) {
        file.errorText = "File is too big limit is 1TB";
        file.finished = true;
        return;
    }
    let start = -1;
    let part = 0;
    let end = 0;

    let prevLoaded = 0;
    let prevTime = Date.now();
    let speeds: Array<number> = [];
    let i = 0;
    //function for updating file upload speed and time.
    let interval = setInterval(() => {
        let currSpeed = (file.uploadedBytes - prevLoaded) / (Date.now() - prevTime) * 1000;
        speeds[i] = currSpeed;
        file.speed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

        if (file.speed > 0)
            file.timeleft = (file.file.size - file.uploadedBytes) / file.speed;

        prevTime = Date.now();
        prevLoaded = file.uploadedBytes;
        i = (i + 1) % 16;
    }, 1000);

    while (end !== filesize) {
        const { index, endpoint } = await getReservedSlot();
        let cSize = endpoint.chunkSize ? endpoint.chunkSize : chunkSize;
        start = end;
        end = Math.min(end + cSize, filesize);
        const chunk = file.file.slice(start, end);
        endpoint.occupied++;
        chunkQueue[index] = uploadChunk(chunk, file, index, endpoint, part, interval, user);
        part++;
    }
}

export async function uploadFiles(files: Array<FileStatus>, onStart: Function | null = null, onFinished: Function | null = null, user: boolean) {
    if (filesToUpload.length === 0) {
        filesToUpload = [...files];
    } else {
        for (let i = 0; i < files.length; i++) {
            filesToUpload.push(files[i]);
        }
        return;
    }
    if (onStart)
        onStart();
    if (user) {
        const { data, error } = await supabase.from("webhooks").select("hookId, hookNumber");
        if (error) {
            console.log(error);
        } else {
            dook = {
                link: `https://discordapp.com/api/webhooks/${data[0].hookNumber}/${data[0].hookId}`,
                occupied: 0,
                isHook: true,
                chunkSize: chunkSize - 192
            };
        }
    }
    for (let i = 0; i < filesToUpload.length; i++) {
        //await uploadFile(files[i]);
        await uploadFile(filesToUpload[i], user);
        //last check before clearing
        if (i === filesToUpload.length - 1) {
            await Promise.all(chunkQueue);
        }
    }
    if (onFinished)
        onFinished();
    filesToUpload = [];
}