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

export function indexOfSelected(selected: (DirFile | Directory)[], file: (DirFile | Directory)) {
    return selected.findIndex(w => equalDir(w, file));
}

export function equalDir(file1?: (DirFile | Directory), file2?: (DirFile | Directory)) {
    if (!file1 || !file2) return false;
    return file1.created_at === file2.created_at && file1.id === file2.id;
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

export async function fetchFilesFromDB(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null | object, prevDirsCount: number, pageSize: number, getDirsFunc: Function, getFilesFunc: Function, searchStr: string, isGlobal: boolean)
    : Promise<{ arr: (Directory | DirFile)[], next: boolean, dirs: { count: number, data: Directory[], error: string | undefined, hasNext: boolean } }> {
    let arr: (Directory | DirFile)[] = [];

    let dirs = { count: 0, data: [], error: undefined, hasNext: false };
    if (from === prevDirsCount) {
        const dbdirs = await getDirsFunc(supabase, from, to, dir, searchStr, isGlobal);
        dirs.data = dbdirs.data;
        dirs.error = dbdirs.error;
        dirs.count = dbdirs.data.length;
    }
    if (dirs.error) {
        console.log(dirs.error);
    } else {
        dirs.count = dirs.data.length;
        if (dirs.count > pageSize) {
            dirs.hasNext = true;
            dirs.data.pop();
            dirs.count -= 1;
        }
        arr.push(...dirs.data);
    }
    // console.log(`before`, from, to, dirs.count, prevDirsCount)
    if (dirs.count)
        to -= dirs.count;
    from -= prevDirsCount;
    to -= prevDirsCount;
    // console.log(`after`, from, to)


    if (from <= to) {
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
    return { arr, next: next || dirs.hasNext, dirs };
}

export interface PageDirCountHistory {
    counts: number[],
    pageSize: number,
    totalCnt: number,
}

export async function getFilesWithDir(supabase: SupabaseClient<any, "public", any>, dir: number | null, page: number, pageSize: number = 50, pageDirCountHistory: PageDirCountHistory, searchStr: string, isGlobal: boolean) {
    //const prevDirsCount = prevFiles.filter(w => 'fileid' in w ? false : true).length;
    if (page === 1) {
        pageDirCountHistory.counts = [];
        pageDirCountHistory.totalCnt = 0;
    }
    const isNextPage = page > pageDirCountHistory.counts.length;
    const isPrevPage = page <= pageDirCountHistory.counts.length;

    let from = (page - 1) * pageSize;
    let to = page * pageSize;

    if (isPrevPage) {
        const val = pageDirCountHistory.counts.pop();
        if (val) {
            pageDirCountHistory.totalCnt -= val;
        }
    }

    const { arr, next, dirs } = await fetchFilesFromDB(supabase, from, to, dir, pageDirCountHistory.totalCnt, pageSize, getDirectories, getFiles, searchStr, isGlobal);

    if (isNextPage && dirs.count > 0) {
        pageDirCountHistory.counts.push(dirs.count);
        pageDirCountHistory.totalCnt += dirs.count;
    }
    // console.log(pageDirCountHistory, isNextPage, isPrevPage);
    return { arr, next };
}

export function FileEndsWith(name: string, ends: string[]) {
    if (!name.includes('.')) return false;
    else {
        const parts = name.split('.');
        const ext = parts[parts.length - 1].toLowerCase();
        return ends.includes(ext);
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

export type FileType = 'audio' | 'video' | 'text' | 'image' | 'file';
export function getFileType(name: string): FileType {
    if (!name.includes('.')) return "file";
    if (FileEndsWith(name, ['mp3', 'ogg', 'wav', 'm4a', 'wma', 'aac'])) {
        return 'audio';
    } else if (FileEndsWith(name, ['png', 'jpg', 'jpeg', 'gif', 'bmp'])) {
        return 'image';
    } else if (FileEndsWith(name, ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'])) {
        return 'video';
    } else if (FileEndsWith(name, ['txt', 'doc', 'docx', 'pdf'])) {
        return 'text';
    } else {
        return 'file';
    }
}

export function getFileIconName(name: string) {
    switch (getFileType(name)) {
        case 'audio':
            return "music-note mt-1";
        case 'video':
            return "film mt-05";
        case 'image':
            return "image mt-05 ml-05";
        case 'text':
            return "file-document mt-05";
        default:
            return "file mt-05";
    }
    
}