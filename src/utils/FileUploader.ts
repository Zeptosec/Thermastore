import axios from "axios";
import { downloadBlob } from "./FileDownload";
import { chunkSize } from "./FileFunctions";
import { supabase } from "./Supabase";
export interface FileStatus {
    file: File,
    uploadedBytes: number,
    uploadedParts: Array<number>,
    errorText: string,
    errorTime: number,
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
    errCount?: number
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

interface ChunkQueueObject {
    index: number,
    remaining?: number,
    reset?: number
}
let chunkQueue: Array<Promise<ChunkQueueObject>> = [];
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
    let json: any = null;
    // to comply with reservation system.
    const { index, endpoint } = await getReservedSlot();
    chunkQueue[index] = (async () => {
        while (json === null)
            await new Promise(r => setTimeout(r, 1000));
        if (json.remaining)
            return { index, remaining: json.remaining, reset: json.reset };
        else return { index };
    })()
    // to upload file.
    while (json === null) {
        try {
            const res = await axios.post(endpoint.link, data);
            if (endpoint.isHook) {
                json = {
                    fileid: res.data.attachments[0].id,
                    remaining: res.headers['x-ratelimit-remaining'],
                    reset: res.headers['x-ratelimit-reset'],
                    after: res.headers['x-ratelimit-reset-after']
                };
            } else
                json = res.data;
        } catch (err: any) {
            console.log(err);
            await new Promise(r => setTimeout(r, 3000));

        }
    }
    return json.fileid as number;
}

async function uploadChunk(chunk: Blob, file: FileStatus, qindex: number, endpoint: Endpoint, partIndex: number, interval: NodeJS.Timer, user: boolean) {
    var data = new FormData();
    data.append('file', chunk);
    let prevLoaded = 0;
    let json = null;
    let chanid = "1025526944776867952";
    while (json === null) {
        try {
            const res = await axios.post(endpoint.link, data, {
                onUploadProgress: function (event) {
                    // for small files on fast internet otherwise overshoots
                    let loaded = Math.min(event.loaded, chunk.size);
                    file.uploadedBytes += loaded - prevLoaded;

                    prevLoaded = loaded;
                    if (file.errorTime + 10000 < Date.now())
                        file.errorText = "";
                }
            })
            if (endpoint.isHook) {
                json = {
                    fileid: res.data.attachments[0].id,
                    remaining: res.headers['x-ratelimit-remaining'],
                    reset: res.headers['x-ratelimit-reset'],
                    after: res.headers['x-ratelimit-reset-after']
                }
                chanid = res.data.channel_id;
            } else
                json = res.data;
        } catch (err: any) {
            file.errorTime = Date.now();
            if (endpoint.isHook && endpoint.errCount != undefined) {
                endpoint.errCount += 1;
                if (err.response) {
                    if (err.response.status === 401 || err.response.status === 404) {
                        console.log("hook is invalid");
                        file.errorText = err.response.data.message;
                        await new Promise(r => setTimeout(r, 120000));
                    }
                    if (err.response.status === 429) {
                        console.log("being rate limited take a break 70s");
                        file.errorText = err.response.data.message;
                        await new Promise(r => setTimeout(r, 70000));
                    }
                }
            } else {
                console.log(err);
                file.errorText = err.message;
                await new Promise(r => setTimeout(r, 15000));
            }
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
            chunks: file.uploadedParts,
            channel_id: chanid,
            chunkSize
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
                        fileid: fdataid,
                        chanid
                    });
                if (error) {
                    console.error(error);
                }
            }
            file.link = `/download/${chanid}/${fdataid}`;
        }

        file.finished = true;
        clearInterval(interval);
    }
    if (json.remaining)
        return { index: qindex, remaining: json.remaining, reset: json.reset };
    return { index: qindex };
}


async function getReservedSlot() {
    let endpoint;
    if (dook) {
        let index = -1;
        if (chunkQueue.length >= 5) {
            const rs = await Promise.any(chunkQueue);
            // cloudflare starts blocking
            // if internet speed is too fast big timeout is neccessary
            index = rs.index;
            await new Promise(r => setTimeout(r, 1500 * index + 1));
        }
        endpoint = dook;
        if (index !== -1) {
            return { index, endpoint };
        }
    } else
        endpoint = await getEndpoint(uploadEndPoints, maxQueueSize);

    if (chunkQueue.length >= maxQueueSize * uploadEndPoints.length) {
        const rs = await Promise.any(chunkQueue);
        return { index: rs.index, endpoint };
    } else {
        return { index: chunkQueue.length, endpoint }
    }
}

async function uploadFile(file: FileStatus, user: boolean) {
    let filesize = file.file.size;
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
        start = end;
        end = Math.min(end + chunkSize, filesize);
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
        } else if (data.length > 0) {
            dook = {
                link: `https://discordapp.com/api/webhooks/${data[0].hookNumber}/${data[0].hookId}`,
                occupied: 0,
                isHook: true,
                errCount: 0
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