import { downloadFile, getFileData, DownloadStatus } from "@/utils/FileDownload";
import { BytesToReadable, Directory, chunkSize } from "@/utils/FileFunctions";
import { Endpoint, uploadFiles, FileStatus } from "@/utils/FileUploader";
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useReducer, useState } from "react";

export interface FileManager {
    downloading: DownloadStatus[],
    uploading: FileStatus[],
    showMenu: boolean,
}

export interface Exposed {
    state: FileManager,
    dispatch: Dispatch<FileAction>,
    getDownloading: (fid: string) => DownloadStatus | null
}

export enum FileActionType {
    'DOWNLOAD', 'UPLOAD', 'REFRESH', 'TOGGLE_MENU', 'RESUME_UPLOAD'
}

export type FileAction = {
    type: FileActionType.DOWNLOAD,
    cid: string,
    fid: string,
    fData?: DownloadStatus
} | {
    type: FileActionType.UPLOAD,
    files: File[],
    user: boolean,
    hook?: Endpoint,
    directory?: Directory
} | {
    type: FileActionType.REFRESH
} | {
    type: FileActionType.TOGGLE_MENU
} | {
    type: FileActionType.RESUME_UPLOAD,
    status: FileStatus,
    user: boolean,
    hook?: Endpoint
}

// no other way tried with states, putting inside context nothing but global works.
let counter = 0;
let interval: NodeJS.Timer | null = null;

export const FileContext = createContext<Exposed | null>(null);

export default function FileManagerProvider({ children }: any) {

    const confMsg = "You are still uploading/downloading files"
    function beforeUnloadHandler(e: BeforeUnloadEvent) {
        (e || window.event).returnValue = confMsg;
        return confMsg;
    }

    function onFinished() {
        if (counter === 1) {
            if (interval) {
                clearInterval(interval);
                window.removeEventListener('beforeunload', beforeUnloadHandler);
                dispatch({ type: FileActionType.REFRESH });
            }
        }
        counter -= 1;
    }

    function onStart() {
        if (counter === 0) {
            interval = setInterval(() => dispatch({ type: FileActionType.REFRESH }), 500);
            window.addEventListener('beforeunload', beforeUnloadHandler);
        }
        counter += 1;
    }

    async function downFile(fd: DownloadStatus, fData?: DownloadStatus) {
        let dt;
        if (fData) {
            dt = fData;
        } else {
            if (fd.fid)
                dt = await getFileData(fd.fid, fd.channel_id);
            else {
                console.log("missing fid");
            }
            if (!dt) {
                alert("Failed to get file data");
                return;
            }
        }
        fd.started_at = new Date().getTime();
        fd.chunks = dt.chunks;// = { ...fd, ...dt, started_at:  }
        fd.name = dt.name;
        fd.size = dt.size;
        if (dt.channel_id)
            fd.channel_id = dt.channel_id;
        await downloadFile(fd, undefined, onStart, onFinished)
    }

    function reducer(state: FileManager, action: FileAction) {
        switch (action.type) {
            case FileActionType.DOWNLOAD:
                const foundFile = state.downloading.find(w => w.fid === action.fid);
                if (foundFile) {
                    // do a 30 second timeout of the same file download.
                    if (foundFile.started_at === 0 || new Date().getTime() - foundFile.started_at < 30 * 1000) {
                        return { ...state };
                    }
                }
                let status: DownloadStatus = {
                    started_at: 0, name: "", size: -1, chunks: [], downloadedBytes: 0, speed: 0, timeleft: 0, precentage: 0, channel_id: action.cid, fid: action.fid,
                };
                console.log(status);
                downFile(status, action.fData);
                return { ...state, downloading: [...state.downloading, status] };

            case FileActionType.UPLOAD:
                let fileStats: FileStatus[] = []
                action.files.forEach(el => {
                    if (state.uploading.findIndex(w => w.file.name === el.name && w.file.length === el.length))
                        fileStats.push({
                            file: el,
                            uploadedBytes: 0,
                            uploadedParts: [],
                            errorText: "",
                            finished: false,
                            link: "",
                            totalPartsCount: Math.ceil(el.size / chunkSize),
                            uploadedPartsCount: 0,
                            speed: 0,
                            timeleft: 0,
                            errorTime: 0,
                            controller: new AbortController(),
                            directory: action.directory
                        })
                    else {
                        console.warn(`Did not add to upload again file: ${el.name}`)
                    }
                });
                if (fileStats.length === 0) {
                    return { ...state };
                }
                uploadFiles(fileStats, onStart, onFinished, action.user, action.hook)
                return { ...state, uploading: [...state.uploading, ...fileStats] }
            case FileActionType.REFRESH:
                return { ...state };
            case FileActionType.TOGGLE_MENU:
                return { ...state, showMenu: !state.showMenu }
            case FileActionType.RESUME_UPLOAD:
                action.status.controller = new AbortController();
                uploadFiles([action.status], onStart, onFinished, action.user, action.hook);
                return { ...state };
            default:
                console.log(`Action does not exist`);
                console.log(action);
                return state;
        }
    }

    const initialParams: FileManager = { downloading: [], uploading: [], showMenu: false }
    const [state, dispatch] = useReducer(reducer, initialParams);

    function getDownloading(fid: string) {
        const ind = state.downloading.findIndex(w => w.fid === fid);
        if (ind === -1)
            return null;
        return state.downloading[ind];
    }

    const exposed: Exposed = {
        state, dispatch, getDownloading
    }
    return (
        <FileContext.Provider value={exposed}>
            {children}
            {/* <div className="bottom-0 fixed grid w-screen text-white justify-center gap-1">
                <p>Uploading</p>
                {state.uploading.map(up => (<div className="flex gap-2">
                    <p>{up.file.name}</p>
                    <p>{up.speed}</p>
                    <p>{up.timeleft}</p>
                </div>))}
            </div> */}
        </FileContext.Provider>
    )
}

export const useFileManager = () => useContext<Exposed | null>(FileContext);