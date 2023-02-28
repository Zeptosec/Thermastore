import { SupabaseClient } from "@supabase/supabase-js";

export const chunkSize = 8 * 1024 ** 2 - 192;

const marks = ["B", "KB", "MB", "GB", "TB", "PB"];

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
    dir: number
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

async function getFilesNoSearch(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null, prevDirsCount: number, pageSize: number) {
    let arr: (Directory | DirFile)[] = [];
    const dirs = dir === null ?
        await supabase
            .from('directories')
            .select('id, name, created_at, dir', { count: 'estimated' })
            .is('dir', null)
            .range(from, to) :
        await supabase
            .from('directories')
            .select('id, name, created_at, dir', { count: 'estimated' })
            .eq('dir', dir)
            .range(from, to);
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
        const files = dir === null ?
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

async function getFilesWithSearch(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null, prevDirsCount: number, pageSize: number, searchStr: string, isGlobal: boolean) {
    let arr: (Directory | DirFile)[] = [];
    let dirs;
    if (isGlobal) {
        dirs = await supabase
            .from('directories')
            .select('id, name, created_at, dir', { count: 'estimated' })
            .like('name', `%${searchStr}%`)
            .range(from, to)
        if (dirs.error) {
            console.log(dirs.error);
        } else {
            arr.push(...dirs.data);
        }
    } else {
        dirs = dir === null ?
            await supabase
                .from('directories')
                .select('id, name, created_at, dir', { count: 'estimated' })
                .is('dir', null)
                .like('name', `%${searchStr}%`)
                .range(from, to) :
            await supabase
                .from('directories')
                .select('id, name, created_at, dir')
                .eq('dir', dir)
                .like('name', `%${searchStr}%`)
                .range(from, to);
        if (dirs.error) {
            console.log(dirs.error);
        } else {
            arr.push(...dirs.data);
        }
    }

    if (dirs.count)
        to -= dirs.count;
    from -= prevDirsCount;
    to -= prevDirsCount;

    if (from < to) {
        if (isGlobal) {
            const files = await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .like('name', `%${searchStr}%`)
                .range(from, to)
            if (!files.error) {
                arr.push(...files.data);
            } else {
                console.log(files.error);
            }
        } else {
            const files = dir === null ?
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
            if (!files.error) {
                arr.push(...files.data);
            } else {
                console.log(files.error);
            }
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
    if (searchStr.length === 0)
        return await getFilesNoSearch(supabase, from, to, dir, prevDirsCount, pageSize);
    else
        return await getFilesWithSearch(supabase, from, to, dir, prevDirsCount, pageSize, searchStr, isGlobal);
}

export function FileEndsWith(name: string, ends: string[]) {
    if (!name.includes('.')) return false;
    else {
        const parts = name.split('.');
        const ext = parts[parts.length - 1].toLowerCase();
        for (let i = 0; i < ends.length; i++) {
            if (ends[i].toLowerCase() === ext)
                return true;
        }
        return false;
    }
}

export function IsAudioFile(name: string){
    return FileEndsWith(name, ['mp3', 'ogg', 'wav']);
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
            return "file-document mt-0.5";

        case "mkv":
        case "mp4":
            return "film mt-0.5";
        default:
            return "file mt-0.5";
    }
}