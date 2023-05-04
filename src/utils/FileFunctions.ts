import { PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import { Endpoint } from "./FileUploader";

export const chunkSize = 25 * 1024 ** 2 - 192;

const marks = ["B", "KB", "MB", "GB", "TB", "PB"];

export const endPoints: Endpoint[] = [
    {
        link: 'https://thestr.onrender.com',
        occupied: 0,
        name: 'render'
    },
    {
        link: 'https://unmarred-accidental-eel.glitch.me',
        occupied: 0,
        name: "glitch"
    },
    {
        link: 'https://streamer.teisingas.repl.co',
        occupied: 0,
        name: 'replit'
    },
    {
        link: 'https://next-streamer-nigerete123.koyeb.app',
        occupied: 0,
        name: 'koyeb'
    },
    { link: 'http://localhost:8000', occupied: 0, name: 'localhost' }
]

/**
 * 
 * @param size Number of bytes to be converted to readable format.
 * @returns Formatted string of readable size.
 */
export function BytesToReadable(size: number, precision: number = 2) {
    let ind = 0;
    const bytesToNext = 1024;
    while (size > bytesToNext) {
        ind++;
        if (ind >= marks.length) {
            ind--;
            break;
        }
        size /= bytesToNext;
    }
    return `${Math.round(size * 10 ** precision) / (10 ** precision)} ${marks[ind]}`;
}

export async function VerifyHook(hook: string) {
    try {
        const parts = hook.split('/');
        //console.log(parts);
        if (parts.length !== 7) {
            return { isValid: false };
        }
        const lhook = `https://discordapp.com/api/webhooks/${parts[parts.length - 2]}/${parts[parts.length - 1]}`
        await axios.post(lhook, { content: "This message was sent to verify hook." });
        return { isValid: true, hookNumber: parts[parts.length - 2], hookId: parts[parts.length - 1], lhook };
    } catch (err) {
        console.log(err);
        return { isValid: false };
    }
}

/**
 * 
 * @param seconds Amount of seconds to convert to readable string.
 * @returns A readable string with days, hours, minutes and seconds.
 */
export function TimeToReadable(seconds: number) {
    let secs = Math.round(seconds % 60);
    let minutes = Math.floor(seconds / 60) % 60;
    let hours = Math.floor(seconds / 3600) % 24;
    let days = Math.floor(seconds / 86400);
    let str = "";
    if (days > 0) {
        str += `${days}d`;
    }
    if (hours > 0 || str.length > 0) {
        if (str.length > 0) str += " ";
        str += `${hours}h`;
    }
    if (minutes > 0 || str.length > 0) {
        if (str.length > 0) str += " ";
        str += `${minutes}min`
    }
    if (str.length > 0) str += " ";
    str += `${secs}s`;
    return str;
}

export interface Directory {
    id: number,
    name: string,
    created_at: string,
    dir: number,
    shared: boolean
}

export interface DirFile {
    id: number,
    name: string,
    created_at: string,
    size: number,
    chanid: string,
    fileid: string,
    dir: number
}

async function getDirectories(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null, searchStr: string, isGlobal: boolean) {
    if (searchStr.length > 0) {
        return isGlobal ?
            await supabase
                .from('directories')
                .select('id, name, created_at, dir, shared', { count: 'estimated' })
                .like('name', `%${searchStr}%`)
                .range(from, to)
            : dir === null ?
                await supabase
                    .from('directories')
                    .select('id, name, created_at, dir, shared', { count: 'estimated' })
                    .is('dir', null)
                    .like('name', `%${searchStr}%`)
                    .range(from, to)
                :
                await supabase
                    .from('directories')
                    .select('id, name, created_at, dir, shared')
                    .eq('dir', dir)
                    .like('name', `%${searchStr}%`)
                    .range(from, to);
    } else {
        return dir === null ?
            await supabase
                .from('directories')
                .select('id, name, created_at, dir, shared', { count: 'estimated' })
                .is('dir', null)
                .range(from, to)
            :
            await supabase
                .from('directories')
                .select('id, name, created_at, dir, shared', { count: 'estimated' })
                .eq('dir', dir)
                .range(from, to);
    }
}

async function getFiles(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null, searchStr: string, isGlobal: boolean) {
    if (searchStr.length > 0) {
        return isGlobal ?
            await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .like('name', `%${searchStr}%`)
                .range(from, to)
            :
            dir === null ?
                await supabase
                    .from('files')
                    .select('id, name, created_at, size, chanid, fileid, dir')
                    .is('dir', null)
                    .like('name', `%${searchStr}%`)
                    .range(from, to) :
                await supabase
                    .from('files')
                    .select('id, name, created_at, size, chanid, fileid, dir')
                    .eq('dir', dir)
                    .like('name', `%${searchStr}%`)
                    .range(from, to)

    } else {
        return dir === null ?
            await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .is('dir', null)
                .range(from, to) :
            await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .eq('dir', dir)
                .range(from, to)
    }
}

export async function fetchFilesFromDB(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null | object, prevDirsCount: number, pageSize: number, getDirsFunc: Function, getFilesFunc: Function, searchStr: string, isGlobal: boolean) {
    let arr: (Directory | DirFile)[] = [];
    const dirs = await getDirsFunc(supabase, from, to, dir, searchStr, isGlobal);
    if (dirs.error) {
        console.log(dirs.error);
    } else {
        arr.push(...dirs.data);
    }

    if (dirs.count)
        to -= dirs.count;
    from -= prevDirsCount;
    to -= prevDirsCount;

    if (from < to) {
        const files = await getFilesFunc(supabase, from, to, dir, searchStr, isGlobal);
        if (!files.error) {
            arr.push(...files.data);
        } else {
            console.log(files.error);
        }
    }
    let next = false;
    if (arr.length === pageSize + 1) {
        next = true;
        arr.pop();
    }
    return { arr, next };
}

export async function getFilesWithDir(supabase: SupabaseClient<any, "public", any>, dir: number | null, page: number, pageSize: number = 50, prevFiles: (DirFile | Directory)[], searchStr: string, isGlobal: boolean) {
    const prevDirsCount = prevFiles.filter(w => 'fileid' in w ? false : true).length;
    let from = (page - 1) * pageSize;
    let to = page * pageSize;
    return await fetchFilesFromDB(supabase, from, to, dir, prevDirsCount, pageSize, getDirectories, getFiles, searchStr, isGlobal);
}

export function FileEndsWith(name: string, ends: string[]) {
    if (!name.includes('.')) return false;
    else {
        const parts = name.split('.');
        const ext = parts[parts.length - 1].toLowerCase();
        return ends.includes(ext);
        // for (let i = 0; i < ends.length; i++) {
        //     if (ends[i].toLowerCase() === ext)
        //         return true;
        // }
        // return false;
    }
}

export async function GetPreviousDir(currDirId: number, supabase: SupabaseClient<any, "public", any>) {
    const { data, error } = await supabase
        .from("directories")
        .select('id, dir(*), name, shared, created_at')
        .eq('id', currDirId);
    if (!error) {
        if (data.length > 0)
            return data[0];
        else return null;
    } else {
        console.log(error);
        return null;
    }
}

export function IsAudioFile(name: string) {
    return FileEndsWith(name, ['mp3', 'ogg', 'wav']);
}

export function IsImageFile(name: string) {
    return FileEndsWith(name, ['png', 'jpg', 'jpeg', 'gif', 'bmp']);
}

export function IsVideoFile(name: string) {
    return FileEndsWith(name, ['mp4', 'mkv', 'mp3', 'wav', 'ogg']);
}

export function getFileIconName(name: string) {
    if (!name.includes('.')) return "file";
    const parts = name.split('.');
    switch (parts[parts.length - 1].toLowerCase()) {
        case "mp3":
        case "ogg":
        case "wav":
            return "music-note mt-1";
        case "txt":
        case "doc":
        case "docx":
            return "file-document mt-05";

        case "mkv":
        case "mp4":
            return "film mt-05";
        default:
            return "file mt-05";
    }
}