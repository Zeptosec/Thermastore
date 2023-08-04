import axios from "axios";
import { Dispatch, SetStateAction } from "react";
import { FileAction, FileActionType, FileToUpload } from "@/context/FileManagerContext";
import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

export const chunkSize = 25 * 1024 ** 2 - 256;

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
    dir: number | null,
    shared: boolean
}

export interface DirFile {
    id: number,
    name: string,
    created_at: string,
    size: number,
    chanid: string,
    fileid: string,
    dir: number | null,
    preview: string | null
}

export interface FilesListSettings {
    currPage: number,
    pageSize: number,
    dirHistory: Directory[],
}

export function getReadableDate(time: string) {
    const date = new Date(time).toISOString();
    const parts = date.split('T');
    return parts[0];
}

export function indexOfSelected(selected: (DirFile | Directory)[], file: (DirFile | Directory)) {
    return selected.findIndex(w => equalDir(w, file));
}

export function equalDir(file1?: (DirFile | Directory) | null, file2?: (DirFile | Directory) | null) {
    if (!file1 || !file2) return false;
    return file1.created_at === file2.created_at && file1.id === file2.id;
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

export async function AddFolder(supabase: SupabaseClient<any, "public", any>, dirHistory: Directory[], setFiles: Dispatch<SetStateAction<(Directory | DirFile)[]>>) {
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
 * Cuts name to size so that it will comply with Database policies. (P.S. to future me: i made a mistake somewhere which sometimes reduces to maxlength - 1 size string was too lazy to debug...)
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
                    const reducedAmount = Math.min(extPart.length, fileNameLimit - minLeftNameLength);
                    const reducedExt = extPart.slice(0, reducedAmount);
                    return `${reducedName}${reducedExt}`;
                } else {
                    return `${reducedName}${extPart}`;
                }
            } else {
                // namePart does not exists or is very small
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
returns files with set directory ids that should be uploaded
*/
async function getPackaged(supabase: SupabaseClient<any, "public", any>, dirs: DirTree[][], filesHere: File[], dir: Directory | undefined, getUserDirLocation: () => Directory | undefined, updateClientDirs: (dirs: Directory[]) => void) {
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
                    alert("Some of directories were not saved to the database! Check the logs.");
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
            // user can navigate while directories are uploading so if user navigates to the page where directories are uploading
            // we want to check if user has moved to that directory by checking history and show these newly created directories to user.
            const userDir = getUserDirLocation()?.id;
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
                updateClientDirs(dirDisplay);
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
 * @param event Event to get webkitdirectory and file tree, or just files.
 * @param directory Directory to upload everything to
 * @param dirHistory Path of current directories that user has taken
 * @param setFiles A function to update files in the UI
 * @param user Boolean to tell if there is a logged in user
 * @param dispatch FileManager dispatcher for dispatching upload events
 */
export async function UpFiles(supabase: SupabaseClient<any, "public", any>, event: any, directory: Directory | undefined, getUserDirLocation: () => Directory | undefined, updateDirectories: (dirs: Directory[]) => void, dispatch: Dispatch<FileAction>, onUploaded?: (fileItem: DirFile) => void) {
    if (event && webkitdirectorySupported() && event.dataTransfer) {
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
        const filesToUpload = await getPackaged(supabase, dirs, filesHere, directory, getUserDirLocation, updateDirectories);
        filesToUpload?.forEach(w => w.onUploaded = onUploaded);
        if (filesToUpload !== null) {
            dispatch({ type: FileActionType.UPLOAD, files: filesToUpload })
        }
    } else if (event.target) {
        // if no dataTransfer object found get files the usual way...
        const fToUpload = Array.from<File>(event.target.files);
        const onlyFiles = await Promise.all(
            fToUpload.filter(async (w: File) => await isFile(w))
        );
        if (onlyFiles.length > 0) {
            const files = onlyFiles.map(w => ({
                file: w,
                directory,
                onUploaded
            } as FileToUpload))
            dispatch({ type: FileActionType.UPLOAD, files })
        } else {
            alert("Directory upload are unsupported! Select only files!");
        }


    } else {
        console.log("Cant get files!");
        console.log(event);
    }
}

/**
 * Checks if file is a file.
 * @param maybeFile File to check if it is a dir. Only use when checking input field files with target.files
 * @returns true if it is a file otherwise - false
 */
export function isFile(maybeFile: File) {
    return new Promise<boolean>(function (resolve, reject) {
        if (maybeFile.type !== '') {
            return resolve(true);
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            if (reader.error && (
                reader.error.name === 'NotFoundError' ||
                reader.error.name === 'NotReadableError'
            )) {
                return resolve(false);
            }
            resolve(true);
        }
        reader.readAsBinaryString(maybeFile)
    })
}

/**
 * 
 * @param videoFile A video file to get the thumbnail from
 * @returns An image file that was taken from supplied video
 */
export async function getThumbnailForVideo(videoFile: File) {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    video.style.display = "none";
    canvas.style.display = "none";
    // Trigger video load
    await new Promise((resolve, reject) => {
        let tmout: NodeJS.Timeout | undefined = undefined;
        video.addEventListener("loadedmetadata", () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Seek the video to 20%-30%
            video.currentTime = video.duration * (0.2 + Math.random() / 10);
        });
        const videoUrl = URL.createObjectURL(videoFile);
        video.addEventListener("seeked", () => {
            clearTimeout(tmout);
            URL.revokeObjectURL(videoUrl);
            resolve(0)
        });
        video.src = videoUrl;
        tmout = setTimeout(() => {
            URL.revokeObjectURL(videoUrl);
            reject("Failed to load the video");
        }, 7000);
    });

    // for some reason it says object is possibly null which is not true.
    //@ts-ignore
    canvas
        .getContext("2d")
        .drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    // const imageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    const imgData = canvas.toDataURL('image/jpeg', 1);
    const image = await fetch(imgData);
    const imageBlob = await image.blob();
    if (imageBlob) {
        return new File([imageBlob], 'thumbnail.jpg', { type: imageBlob.type });
    } else {
        return null;
    }
}

export function getHookLink(id: string, token: string) {
    return `https://discordapp.com/api/webhooks/${id}/${token}`;
}

export interface PageItems {
    dirs: Directory[],
    files: DirFile[],
    hasNext: boolean,
    error?: string
}

/**
 * Fetches info about files and directories from database
 * @param supabase supabase
 * @param direc id of directory to fetch from
 * @param search_str search string
 * @param is_global if set to true direc will be ignored and all files will be searched and fetched
 * @param from_num offset items from
 * @param to_num offset items to
 * @param order_column order by
 * @param order_dir order direction
 * @returns dirs and files and if has more to fetch
 */
export async function getItems(supabase: SupabaseClient<any, "public", any>, direc: number | null, search_str: string, is_global: boolean, from_num: number, to_num: number, order_column: 'name' | 'id' | 'size', order_dir: 'asc' | 'desc'): Promise<PageItems> {
    const { data, error } = await supabase.rpc('get_items', { direc, search_str, is_global, from_num, to_num: to_num + 1, order_column, order_dir });
    if (error) {
        console.log(error);
        return { dirs: [], files: [], hasNext: false, error: error.message };
    }
    const pageSize = to_num - from_num;
    const hasNext: boolean = data.length > pageSize;
    if (hasNext) data.pop();
    // tried to do it with delete object['prop'] but forEach does not return results and typescript doesn't like that
    const dirs: Directory[] = data.filter(w => w.fileid === null).map(w => ({
        id: w.id,
        created_at: w.created_at,
        dir: w.dir,
        name: w.name,
        shared: w.shared
    }))
    const files: DirFile[] = data.filter(w => w.fileid !== null).map(w => ({
        id: w.id,
        name: w.name,
        created_at: w.created_at,
        size: w.size,
        chanid: w.chanid,
        fileid: w.fileid,
        dir: w.dir,
        preview: w.preview
    }));
    return { dirs, files, hasNext };

}