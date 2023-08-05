import { downloadFile, getFileData, DownloadStatus } from "@/utils/FileDownload";
import { DirFile, Directory, UpFiles, VerifyHook, chunkSize, getHookLink } from "@/utils/FileFunctions";
import { Endpoint, uploadFiles, FileStatus } from "@/utils/FileUploader";
import { Dispatch, createContext, useContext, useEffect, useReducer, useState } from "react";
import { useSupabaseClient, useUser, User, SupabaseClient, useSessionContext } from "@supabase/auth-helpers-react";
import { StoredStreams } from "@/components/SettingsComps/StreamersManager";
import { getStreamerName } from "@/utils/utils";

export interface FileManager {
    downloading: DownloadStatus[],
    uploading: FileStatus[],
    showMenu: boolean,
    supabase: SupabaseClient<any, "public", any>,
    user: User | null
}

export interface Exposed {
    state: FileManager,
    dispatch: Dispatch<FileAction>,
    getDownloading: (fid: string) => DownloadStatus | null,
    setHook: (id: string, token: string) => Promise<boolean>,
    user: User | null,
    isLoading: boolean,
    setNewStreamers: (streams: string[], save?: boolean) => void,
    streamers: Endpoint[],
    uploadToDir: (direc: Directory | undefined, event: any, updateDirs: (dirs: Directory[]) => void, getUserDirLocation: () => Directory | undefined, onUploaded?: (fileItem: DirFile) => void) => void,
}

export enum FileActionType {
    'DOWNLOAD', 'UPLOAD', 'REFRESH', 'TOGGLE_MENU', 'RESUME_UPLOAD', 'RESUME_DOWNLOAD', 'SET_SUPABASE'
}

export interface FileToUpload {
    file: File,
    directory?: Directory,
    onUploaded?: (fileItem: DirFile) => void
}

export type FileAction = {
    type: FileActionType.DOWNLOAD,
    cid: string,
    fid: string,
    fData?: DownloadStatus
} | {
    type: FileActionType.UPLOAD,
    files: FileToUpload[],
} | {
    type: FileActionType.REFRESH
} | {
    type: FileActionType.TOGGLE_MENU
} | {
    type: FileActionType.RESUME_UPLOAD,
    status: FileStatus,
} | {
    type: FileActionType.RESUME_DOWNLOAD,
    status: DownloadStatus
} | {
    type: FileActionType.SET_SUPABASE,
    user: User | null,
    supabase: SupabaseClient<any, "public", any>
}

interface LoadingState {
    cnt: number,
    state: boolean,
    msg?: string
}

// no other way tried with states, putting inside context nothing but global works.
let counter = 0;
let interval: NodeJS.Timer | null = null;

export const FileContext = createContext<Exposed | null>(null);

export function FileManagerProvider({ children }: any) {
    const [hook, sHook] = useState<Endpoint>();
    const [streamers, setStreamers] = useState<Endpoint[]>([]);
    const supabase = useSupabaseClient();
    const user = useUser();
    const { isLoading } = useSessionContext();
    // kind of weird reducer thinks that supabase is undefined i guess you cant use context in another context and use in reducer
    const initialParams: FileManager = { downloading: [], uploading: [], showMenu: false, supabase, user }
    const [state, dispatch] = useReducer(reducer, initialParams);
    const [loading, setLoading] = useState<LoadingState>({ cnt: 0, state: true });

    function adjustLoading(msg?: string) {
        setLoading(w => {
            return ({
                cnt: w.cnt + 1,
                state: w.cnt + 1 < 2,
                msg
            })
        }
        )
    }

    const confMsg = "You are still uploading/downloading files";
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
                dt = await getFileData(fd.fid, fd.channel_id, streamers);
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
        await downloadFile(fd, streamers, undefined, onStart, onFinished)
    }

    function reducer(state: FileManager, action: FileAction): FileManager {
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
                downFile(status, action.fData);
                return { ...state, downloading: [...state.downloading, status] };

            case FileActionType.UPLOAD:
                let fileStats: FileStatus[] = []
                action.files.forEach(el => {
                    if (state.uploading.findIndex(w => w.file.name === el.file.name && w.file.length === el.file.length) === -1)
                        fileStats.push({
                            file: el.file,
                            uploadedBytes: 0,
                            uploadedParts: [],
                            errorText: "",
                            finished: false,
                            link: "",
                            totalPartsCount: Math.ceil(el.file.size / chunkSize),
                            uploadedPartsCount: 0,
                            speed: 0,
                            timeleft: 0,
                            errorTime: 0,
                            controller: new AbortController(),
                            directory: el.directory,
                            onUploaded: el.onUploaded
                        })
                    else {
                        console.warn(`Did not add to upload file again: ${el.file.name}`)
                    }
                });
                if (fileStats.length === 0) {
                    return { ...state };
                }
                if (!state.supabase) {
                    console.error("Supabase is undefined!!!!");
                    alert("Supabase is not defined");
                    return state;
                }
                if (hook)
                    uploadFiles(state.supabase, fileStats, onStart, onFinished, state.user !== null, hook)
                else
                    console.log("No available hook!");
                return { ...state, uploading: [...state.uploading, ...fileStats] }
            case FileActionType.REFRESH:
                return { ...state };
            case FileActionType.TOGGLE_MENU:
                return { ...state, showMenu: !state.showMenu }
            case FileActionType.RESUME_UPLOAD:
                action.status.controller = new AbortController();
                action.status.isPaused = false;
                if (!state.supabase) {
                    console.error("Supabase is undefined !!!!");
                    alert("Supabase is not defined");
                    return state;
                }
                if (hook)
                    uploadFiles(state.supabase, [action.status], onStart, onFinished, state.user !== null, hook);
                else
                    console.log('No hook to resume with');
                return { ...state };
            case FileActionType.RESUME_DOWNLOAD:
                downFile(action.status, action.status);
                return { ...state };
            case FileActionType.SET_SUPABASE:
                return { ...state, user: action.user, supabase: action.supabase };
            default:
                console.log(`Action does not exist`);
                console.log(action);
                return state;
        }
    }

    function setNewStreamers(streams: string[], save?: boolean) {
        let newStreams: Endpoint[] = streams.map(w => ({
            occupied: 0,
            link: w,
            name: getStreamerName(w)
        }));
        ['https://silent-tartan-giganotosaurus.glitch.me', 'https://unmarred-accidental-eel.glitch.me', 'https://thestr.onrender.com']
            .forEach((w, ind) =>
                newStreams.push({
                    occupied: 0,
                    link: w,
                    name: `streamer ${ind + 1}`
                })
            );
        newStreams.push({
            occupied: 0,
            link: 'http://localhost:8000',
            name: 'localhost'
        })
        setStreamers(newStreams);
        adjustLoading("Loading streamers");
        if (save) {
            const streamersToStore: StoredStreams = {
                links: streams,
                time: new Date().getTime()
            }
            localStorage.setItem('streamers', JSON.stringify(streamersToStore));
        }
    }

    async function resetStreamers(): Promise<string | undefined> {
        const { data, error } = await supabase
            .from('streamers')
            .select('link');

        if (error) {
            return error.message;
        } else {
            setNewStreamers(data.map(w => w.link), true);
        }
    }

    const hookChangeInterval = 1000 * 60 * 60 * 24 * 6.66; // every 6.66 days get a new hook just because...
    // fetch hooks on app open
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            localStorage.removeItem('streamers');
            localStorage.removeItem('theme');
        }
        async function fetchNewHook() {
            if (user) {
                const userHook = await supabase
                    .from('webhooks')
                    .select('hookNumber, hookId')
                    .single();
                if (userHook.error) {
                    console.log("failed to get user hook");
                    console.log(userHook.error);
                }
                if (!userHook.error && userHook.data) {
                    await setHook(userHook.data.hookNumber, userHook.data.hookId);
                    return;
                }
            }
            const { data, error } = await supabase.rpc('getfreehook').single();
            if (error) {
                console.log(error);
            } else {
                await setHook(data.hookurl, data.hookid);
            }
        }

        async function fetchNewStreamers() {
            if (!user) {
                setNewStreamers([]);
                return;
            }
            const localStreams = localStorage.getItem('streamers');
            if (localStreams) {
                try {
                    const storedStreams: StoredStreams = JSON.parse(localStreams);
                    if (storedStreams.time + hookChangeInterval < new Date().getTime()) {
                        // enough time has passed. Need to refetch
                        await resetStreamers();
                    } else {
                        // not enough time has passed.
                        setNewStreamers(storedStreams.links);
                    }
                } catch (err: any) {
                    console.log(err.message);
                    localStorage.removeItem('streams');
                    //fetch new streams
                    await resetStreamers();
                }
            } else {
                await resetStreamers();
            }
        }
        fetchNewStreamers();

        const hookData = JSON.parse(localStorage.getItem('dhook') || '{}');
        const currTime = new Date().getTime();
        if (hookData.id && hookData.token && hookData.time && hookData.time + hookChangeInterval > currTime) {
            adjustLoading("Loading webhook from localStorage");
            sHook({
                link: getHookLink(hookData.id, hookData.token),
                occupied: 0
            });
        } else {
            fetchNewHook();
        }
        dispatch({ type: FileActionType.SET_SUPABASE, user, supabase });
    }, [supabase, user, isLoading]);

    function getDownloading(fid: string) {
        const ind = state.downloading.findIndex(w => w.fid === fid);
        if (ind === -1)
            return null;
        return state.downloading[ind];
    }

    async function setHook(id: string, token: string, save?: boolean) {
        const hooklink = getHookLink(id, token);
        const validation = await VerifyHook(hooklink);
        if (validation.isValid) {
            const buf = JSON.stringify({ id, token, time: new Date().getTime() });
            localStorage.setItem('dhook', buf);
            sHook({
                link: hooklink,
                occupied: 0
            });
            adjustLoading("Loading webhook from database");
            if (save) {
                const thahook = { hookNumber: validation.hookNumber, hookId: validation.hookId }
                const q1 = await supabase
                    .from("webhooks")
                    .select("id")
                    .single();
                if (q1.data) {
                    const { error } = await supabase
                        .from("webhooks")
                        .update(thahook)
                        .eq('id', q1.data.id);
                    if (error) {
                        console.log(error);
                        return false;
                    }
                } else {
                    const { error } = await supabase
                        .from('webhooks')
                        .insert(thahook)
                    if (error) {
                        console.log(error);
                        return false;
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    }

    function uploadToDir(direc: Directory | undefined, event: any, updateDirs: (dirs: Directory[]) => void, getUserDirLocation: () => Directory | undefined, onUploaded?: (fileItem: DirFile) => void) {
        UpFiles(supabase, event, direc, getUserDirLocation, updateDirs, dispatch, onUploaded);
    }


    return (
        <FileContext.Provider value={{
            state,
            dispatch,
            getDownloading,
            setHook,
            user,
            isLoading: loading.state,
            uploadToDir,
            streamers,
            setNewStreamers
        }}>
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

export default function useFileManager(): Exposed {
    const context = useContext(FileContext);
    if (!context) throw new Error("Missing FileContextProvider in parent!");
    return context;
}