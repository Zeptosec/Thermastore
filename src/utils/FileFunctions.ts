import { PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import { Endpoint } from "./FileUploader";
import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { FileActionType, FileToUpload } from "@/context/FileManagerContext";
import { supabase } from "./Supabase";

export const chunkSize = 25 * 1024 ** 2 - 256;

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
    let secs = Math.floor(seconds % 60);
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

export function getReadableDate(time: string) {
    const date = new Date(time).toISOString();
    const parts = date.split('T');
    return parts[0];
}

export function indexOfSelected(selected: (DirFile | Directory)[], file: (DirFile | Directory)) {
    return selected.findIndex(w => equalDir(w, file));
}

export function equalDir(file1?: (DirFile | Directory), file2?: (DirFile | Directory)) {
    if (!file1 || !file2) return false;
    return file1.created_at === file2.created_at && file1.id === file2.id;
}

async function getDirectories(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null, searchStr: string, isGlobal: boolean) {
    const sortBy = 'name'
    if (searchStr.length > 0) {
        return isGlobal ?
            await supabase
                .from('directories')
                .select('id, name, created_at, dir, shared', { count: 'estimated' })
                .like('name', `%${searchStr}%`)
                .order(sortBy, { ascending: true })
                .range(from, to)
            : dir === null ?
                await supabase
                    .from('directories')
                    .select('id, name, created_at, dir, shared', { count: 'estimated' })
                    .is('dir', null)
                    .like('name', `%${searchStr}%`)
                    .order(sortBy, { ascending: true })
                    .range(from, to)
                :
                await supabase
                    .from('directories')
                    .select('id, name, created_at, dir, shared')
                    .eq('dir', dir)
                    .like('name', `%${searchStr}%`)
                    .order(sortBy, { ascending: true })
                    .range(from, to);
    } else {
        return dir === null ?
            await supabase
                .from('directories')
                .select('id, name, created_at, dir, shared', { count: 'estimated' })
                .is('dir', null)
                .order(sortBy, { ascending: true })
                .range(from, to)
            :
            await supabase
                .from('directories')
                .select('id, name, created_at, dir, shared', { count: 'estimated' })
                .eq('dir', dir)
                .order(sortBy, { ascending: true })
                .range(from, to);
    }
}

async function getFiles(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: number | null, searchStr: string, isGlobal: boolean) {
    const sortBy = 'name';
    if (searchStr.length > 0) {
        return isGlobal ?
            await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .like('name', `%${searchStr}%`)
                .order(sortBy, { ascending: true })
                .range(from, to)
            :
            dir === null ?
                await supabase
                    .from('files')
                    .select('id, name, created_at, size, chanid, fileid, dir')
                    .is('dir', null)
                    .like('name', `%${searchStr}%`)
                    .order(sortBy, { ascending: true })
                    .range(from, to) :
                await supabase
                    .from('files')
                    .select('id, name, created_at, size, chanid, fileid, dir')
                    .eq('dir', dir)
                    .order(sortBy, { ascending: true })
                    .like('name', `%${searchStr}%`)
                    .range(from, to)

    } else {
        return dir === null ?
            await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .is('dir', null)
                .order(sortBy, { ascending: true })
                .range(from, to) :
            await supabase
                .from('files')
                .select('id, name, created_at, size, chanid, fileid, dir')
                .eq('dir', dir)
                .order(sortBy, { ascending: true })
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
            return "music-note mt-1 ml-2";
        case 'video':
            return "film mt-05";
        case 'image':
            return "image mt-05 ml-05";
        case 'text':
            return "file-document mt-05";
        default:
            return "file mt-05 ml-05";
    }

}

export async function AddFolder(dirHistory: Directory[], supabase: SupabaseClient<any, "public", any>, setFiles: Dispatch<SetStateAction<(Directory | DirFile)[]>>) {
    let name = prompt("Directory name", "Directory");
    if (name) {
        if (name.length < 3) {
            alert("Directory name is too short");
        } else {
            name = MinimizeName(name);
            const dir = dirHistory.length > 0 ? dirHistory[dirHistory.length - 1].id : null;
            const res = await supabase
                .from("directories")
                .insert({ name, dir })
                .select('id, name, created_at, dir, shared');
            if (res.error) {
                switch (res.error.code) {
                    case "42501":
                        alert("You have reached your file and directory limit");
                        break;
                    default:
                        alert(res.error.message);
                }
                console.log(res.error);
            } else {
                setFiles(w => [res.data[0], ...w]);
            }
        }
    }
}

const fileNameLimit = 71;
const minLeftNameLength = 3;
/**
 * 
 * @param name name of file or directory
 * @returns formatted name
 */
export function MinimizeName(name: string) {
    // checking if name length is not above limit
    if (name.length > fileNameLimit) {
        // finding last period where extention begins
        const extStartInd = name.lastIndexOf('.');

        if (extStartInd !== -1) {
            // name has extension
            // getting name part 
            const namePart = name.slice(0, extStartInd - 1);
            // getting extension part
            const extPart = name.slice(extStartInd);
            // amount of characters that must be cutted
            const maxAmountToCut = name.length - fileNameLimit;

            if (namePart.length > minLeftNameLength) {
                // namePart can be reduced
                const endInd = namePart.length - maxAmountToCut;
                const reducedName = namePart.slice(0, Math.max(endInd, minLeftNameLength));
                // name could not be reduced anymore
                // reducing extensions
                if (endInd < minLeftNameLength) {
                    // position to reduce extension to
                    const reducedAmount = extPart.length + minLeftNameLength - fileNameLimit;
                    const reducedExt = extPart.slice(0, reducedAmount);
                    return `${reducedName}${reducedExt}`;
                }
            } else {
                // namePart does not exists or very small
                const reducedExt = extPart.slice(0, extPart.length - maxAmountToCut)
                return `${namePart}${reducedExt}`;
            }
        } else {
            // name does not have extensions just cut it to size
            return name.slice(0, fileNameLimit - 1);
        }
    }
    // name is good size return as it is
    return name;
}

interface DirTree {
    name: string,
    files: File[]
    dir: DirTree | Directory | undefined, // to which directory this belongs
    currDir?: Directory              // info about this directory
}

function handleFile(item: any, directory: Directory | undefined | DirTree, dirs: DirTree[][], depth: number, forFile: (file: File) => void) {
    // directory id => array of files
    if (item.isFile) {
        // Get file
        item.file(forFile);
    } else if (item.isDirectory) {
        if (depth > 9) {
            alert("Max tree depth reached");
            return undefined;
        }
        // Create directory
        let dirObj: DirTree = {
            name: MinimizeName(item.name),
            files: [],
            dir: directory
        };

        // building directory levels to minimize requests to database
        if (!dirs[depth]) {
            dirs[depth] = [dirObj];
        } else
            dirs[depth].push(dirObj);
        // Get folder contents
        var dirReader = item.createReader();
        dirReader.readEntries(async function (entries: any) {
            for (var i = 0; i < entries.length; i++) {
                handleFile(entries[i], dirObj, dirs, depth + 1, file => {
                    dirObj.files.push(file);
                });
            }
        });
    }
}

function webkitdirectorySupported() {
    return 'webkitdirectory' in document.createElement('input')
}

/* 
Dir levels
2  dir4   dir5   dir6  dir7 dir8 dir9
       \  /       |        \ | /
1      dir1      dir2      dir3

the first level all three directories will be created
then we will be able to get those directories ids and then second level can be created using first level ids

This saves 5 times amount of requests from 9 to 2 requests.
The worst case if theres one directory that has one directory that has one directory and so on. But usually thats not the case.
*/
async function getPackaged(dirs: DirTree[][], filesHere: File[], dir: Directory | undefined, dirHistory: Directory[], setFiles: Dispatch<SetStateAction<(Directory | DirFile)[]>>) {
    let filesToUpload: FileToUpload[] = [];
    if (dirs.length > 0) {
        for (let i = 0; i < dirs.length; i++) {
            let dirsToSave = dirs[i].map(w => {
                let tdir = null;
                if (w.dir) {
                    if ('id' in w.dir) {
                        tdir = w.dir.id;
                    } else if (w.dir.currDir) {
                        tdir = w.dir.currDir.id;
                    }
                }
                return { name: w.name, dir: tdir };
            })

            const { data, error } = await supabase
                .from('directories')
                .insert(dirsToSave)
                .select('id, created_at, dir');

            if (error) {
                console.log(error);
                alert("Failed to setup directories " + error);
                return null;
            }
            // assuming that order is preserved
            // prepare for next iteration
            for (let j = 0; j < dirs[i].length; j++) {
                if (data[j] === undefined) {
                    console.log(`saved`, data, `dirs that were suppose to be saved`, dirsToSave, `derived from`, dirs[i]);
                    alert("Some of directories was not saved to database! Check logs.");
                    return null;
                }
                dirs[i][j].currDir = {
                    id: data[j].id,
                    name: dirs[i][j].name,
                    created_at: data[j].created_at,
                    dir: data[j].dir,
                    shared: false
                } as Directory;
                // preparing files for upload
                for (let k = 0; k < dirs[i][j].files.length; k++) {
                    const fileToUpload: FileToUpload = {
                        file: dirs[i][j].files[k],
                        directory: dirs[i][j].currDir
                    }
                    filesToUpload.push(fileToUpload);
                }
            }

            const userDir = dirHistory.length > 0 ? dirHistory[dirHistory.length - 1].id : null;
            const dirsInUserDir = dirs[i].filter(w => w.currDir?.dir === userDir);
            // if directories that were stored are in the place where user is then update the file list
            if (dirsInUserDir.length > 0) {
                let dirDisplay: Directory[] = [];
                for (let j = 0; j < dirsInUserDir.length; j++) {
                    const dir = dirsInUserDir[j].currDir;
                    if (dir) {
                        dirDisplay.push(dir);
                    }
                }
                // display newly created directories at the top
                setFiles(w => [...dirDisplay, ...w]);
            }
        }
    }
    // preparing files that should be uploaded in the **dir**
    for (let i = 0; i < filesHere.length; i++) {
        const fileToUpload: FileToUpload = {
            file: filesHere[i],
            directory: dir
        }
        filesToUpload.push(fileToUpload);
    }
    return filesToUpload;
}

/**
 * 
 * @param _files List of all files does not list whats inside directory.
 * @param directory Directory to upload everything to
 * @param dirHistory Path of current directories that user has taken
 * @param setFiles A function to update files in the UI
 * @param user Boolean to tell if there is a logged in user
 * @param fm Refrence to FileManager
 * @param event Event to get webkitdirectory and file tree.
 */
export async function UpFiles(_files: FileList | null, directory: Directory | undefined, dirHistory: Directory[], setFiles: Dispatch<SetStateAction<(Directory | DirFile)[]>>, user?: boolean, fm?: any, event?: any) {
    if (event && webkitdirectorySupported()) {
        let items = event.dataTransfer.items;
        let dirs: DirTree[][] = [];
        let filesHere: File[] = [];
        for (let i = 0; i < items.length; i++) {
            let item = items[i].webkitGetAsEntry();
            if (item) {
                handleFile(item, directory, dirs, 0, file => {
                    filesHere.push(file);
                });
            }
        }
        // have to wait a bit because array wont be filled with files
        // no idea how to do it without this timeout. I tried using async await, tried promises but i just get one file and thats it - does not work.
        await new Promise(r => setTimeout(r, 500));
        const filesToUpload = await getPackaged(dirs, filesHere, directory, dirHistory, setFiles);
        if (filesToUpload !== null) {
            fm?.dispatch({ type: FileActionType.UPLOAD, files: filesToUpload, user: user ? user : true })
        }
    } else if (_files) {
        console.log('webkitdirectory not supported');
        const files = Array.from(_files).map(w => ({
            file: w,
            directory
        } as FileToUpload))
        fm?.dispatch({ type: FileActionType.UPLOAD, files, user: user ? user : true })
    }
}