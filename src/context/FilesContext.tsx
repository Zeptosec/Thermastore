import { Directory, DirFile, equalDir, getItems, GetPreviousDir, MinimizeName, PageItems } from "@/utils/FileFunctions";
import { createRouteParams, getRouteParamsFromPath, getRouterParams, RouteParams } from "@/utils/utils";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Dispatch, PropsWithChildren, createContext, useContext, useEffect, useReducer, useState } from "react";
import { usePathname } from 'next/navigation'
export type OrderBy = 'name' | 'id' | 'size';
export type OrderDir = 'asc' | 'desc';

export interface Files {
    dirs: Directory[],
    files: DirFile[],
    dirHistory: Directory[]
    currPage: number,
    selected: (Directory | DirFile)[],
    currPageSize: number,
    canNext: boolean,
    searchStr: string,
    isGlobal: boolean,
    fetching: boolean,
    isLoading: boolean,
    orderBy: OrderBy,
    orderDir: OrderDir,
    error?: string
}

interface ExposedFiles {
    state: Files,
    dispatch: Dispatch<SettingAction>
    addFolder: () => Promise<void>
    moveSelected: (dirId: number | null) => Promise<void>
    deleteSelected: () => Promise<void>,
    setName: (table: 'files' | 'directories', name: string, id: number) => Promise<void>
    changeSharing: (dir: Directory, shared: boolean) => Promise<string | undefined>
    pressedDir: (dir: Directory | null) => void,
    pressedBack: () => void
}


export enum SettingActionType {
    'GET_ITEMS',
    'SET_FROM_ROUTER',
    'SET_ITEMS',
    'ADD_DIR_TOP',
    'SET_SELECTED',
    'RELOAD'
}

export type SettingAction = {
    type: SettingActionType.GET_ITEMS,
    dir?: Directory | null,
    page?: number,
    pageSize?: number,
    searchStr?: string,
    isGlobal?: boolean,
    orderBy?: OrderBy,
    orderDir?: OrderDir
} | {
    type: SettingActionType.SET_FROM_ROUTER,
    params: RouteParams,
    dirs: Directory[]
} | {
    type: SettingActionType.SET_ITEMS,
    files: DirFile[],
    dirs: Directory[],
    canNext: boolean,
    dirHistory?: Directory[],
    error?: string
} | {
    type: SettingActionType.ADD_DIR_TOP,
    dir: Directory
} | {
    type: SettingActionType.SET_SELECTED,
    selected: (Directory | DirFile)[],
} | {
    type: SettingActionType.RELOAD
}

function reducer(state: Files, action: SettingAction): Files {
    switch (action.type) {
        case SettingActionType.RELOAD:
            return { ...state, isLoading: true, fetching: true };
        case SettingActionType.SET_SELECTED:
            return { ...state, selected: action.selected };
        case SettingActionType.ADD_DIR_TOP:
            return { ...state, dirs: [action.dir, ...state.dirs] };
        case SettingActionType.GET_ITEMS:
            let changes: any = {};
            if (action.dir !== undefined && !equalDir(state.dirHistory[state.dirHistory.length - 1], action.dir)) {
                if (action.dir === null) {
                    if (state.dirHistory.length > 0)
                        changes.dirHistory = [];
                } else {
                    const dirInd = state.dirHistory.findIndex(w => w.id === action.dir?.id)
                    if (dirInd !== -1) {
                        changes.dirHistory = state.dirHistory.slice(0, dirInd + 1);
                    } else {
                        changes.dirHistory = [...state.dirHistory, action.dir];
                    }
                }
            }
            // shot myself in the foot here if action.isGlobal comes with a value of undefined or false it wont change
            if (action.isGlobal !== undefined && state.isGlobal !== action.isGlobal) {
                changes.isGlobal = action.isGlobal;
            }

            if (action.page !== undefined && state.currPage !== action.page) {
                changes.currPage = action.page;
            }

            if (action.pageSize !== undefined && state.currPageSize !== action.pageSize) {
                changes.currPageSize = action.pageSize;
            }
            // a bug apparently if string is '' then checking with if(str) will return false. Gotta remember that
            if (action.searchStr !== undefined && state.searchStr !== action.searchStr) {
                changes.searchStr = action.searchStr;
            }

            if (action.orderBy !== undefined && state.orderBy !== action.orderBy) {
                changes.orderBy = action.orderBy;
            }

            if (action.orderDir !== undefined && state.orderDir !== action.orderDir) {
                changes.orderDir = action.orderDir;
            }

            if (Object.keys(changes).length === 0) return state;
            return { ...state, ...changes, fetching: true, isLoading: true };
        case SettingActionType.SET_FROM_ROUTER:

            return {
                ...state,
                dirHistory: action.dirs,
                currPage: action.params.p ?? 1,
                searchStr: action.params.q ?? '',
                isGlobal: action.params.g ?? false,
                fetching: true,
                isLoading: true,
            }
        case SettingActionType.SET_ITEMS:
            const { files, dirs, canNext } = action;
            let changes2: any = {};
            if (action.dirHistory !== undefined)
                changes2.dirHistory = action.dirHistory;
            if (action.error !== undefined)
                changes2.error = action.error;

            return { ...state, files, dirs, canNext, fetching: false, isLoading: false, ...changes2 };
        default:
            console.warn("Unknown action type!!");
            return state;
    }
}

const FilesContext = createContext<ExposedFiles | null>(null);

interface Props extends PropsWithChildren {
    dataFunction?: (dir: Directory | null, searchStr: string, from: number, to: number, orderBy: OrderBy, orderDir: OrderDir) => Promise<PageItems>
    dontUseParams?: string[],
    onPressedDir?: (dir: Directory | null) => void,
    onBrowserBackForward?: (newUrl: string) => void,
}

export function FilesContextProvider(props: Props) {
    const supabase = useSupabaseClient();
    const [routed, setRouted] = useState(false);
    const [state, dispatch] = useReducer(reducer, {
        currPage: 1,
        dirHistory: [],
        dirs: [],
        files: [],
        selected: [],
        currPageSize: 50,
        canNext: false,
        searchStr: "",
        isGlobal: false,
        fetching: false,
        isLoading: true,
        orderBy: 'name',
        orderDir: 'asc'
    })
    const router = useRouter();
    const pathname = usePathname();
    // cant put this function in reducer because somehow supabase becomes undefined or bugged no idea
    useEffect(() => {
        async function fetchData() {
            const dir = state.dirHistory.length === 0 ? null : state.dirHistory[state.dirHistory.length - 1]
            const from = (state.currPage - 1) * state.currPageSize;
            const to = state.currPage * state.currPageSize;
            let rez: PageItems;
            let updatedDirHistory: Directory[] | undefined = undefined;
            if (props.dataFunction)
                rez = await props.dataFunction(dir, state.searchStr, from, to, state.orderBy, state.orderDir);
            else {
                rez = await getItems(supabase, dir ? dir.id : null, state.searchStr, state.isGlobal, from, to, state.orderBy, state.orderDir);
                updatedDirHistory = await getUpdatedDirHistory();
            }
            dispatch({ type: SettingActionType.SET_ITEMS, files: rez.files, dirs: rez.dirs, canNext: rez.hasNext, dirHistory: updatedDirHistory })
        }
        if (state.fetching) {
            fetchData();
        } else if (state.fetching === state.isLoading)
            setRouterQuery();
    }, [state.fetching]);

    function setRouterQuery() {
        if (!pathname) return;
        const params = createRouteParams(state);
        if (props.dontUseParams) props.dontUseParams.forEach(w => params.delete(w));
        const paramUrl = params.toString();
        let finalUrl: string = pathname;
        if (paramUrl.length > 0) {
            finalUrl += `?${paramUrl}`;
        }
        router.push(finalUrl, undefined, { shallow: true });
    }

    async function getUpdatedDirHistory(): Promise<Directory[] | undefined> {
        const histCount = state.dirHistory.length;
        if (histCount === 1) {
            // let fetchPdir = false;
            const lastDir = state.dirHistory[0];
            // if (lastDir.dir) {
            //     const beforeLastDir = histCount > 1 ? state.dirHistory[state.dirHistory.length - 2] : null;
            //     if (beforeLastDir) {
            //         if (beforeLastDir.id !== lastDir.dir) {
            //             fetchPdir = true;
            //         }
            //     } else if (lastDir.dir !== null) {
            //         fetchPdir = true;
            //     }
            // }
            // if (fetchPdir) {
            // would be better to check lastDir.dir === null and not fetch if it is equal but then i would have to save previous dir id in url soo maybe later
            const pdir = await GetPreviousDir(lastDir.id, supabase);
            if (pdir) {
                if (pdir.dir) {
                    const midDir = pdir.dir;
                    pdir.dir = pdir.dir.id;
                    return [midDir, pdir];
                } else {
                    return [pdir];
                }
            }
            // }
        }
    }

    function pressedDir(dir: Directory | null) {
        dispatch({ type: SettingActionType.GET_ITEMS, dir, page: 1, isGlobal: false });
        if (props.onPressedDir) props.onPressedDir(dir);
    }

    function pressedBack() {
        const histCount = state.dirHistory.length;
        if (histCount > 1) {
            pressedDir(state.dirHistory[histCount - 2]);
        } else {
            pressedDir(null);
        }
    }

    async function addFolder() {
        let name = prompt("Directory name", "Directory");
        if (name) {
            if (name.length < 3) {
                alert("Directory name is too short");
            } else {
                name = MinimizeName(name);
                const dir = state.dirHistory.length > 0 ? state.dirHistory[state.dirHistory.length - 1].id : null;
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
                    dispatch({ type: SettingActionType.ADD_DIR_TOP, dir: res.data[0] });
                }
            }
        }
    }

    async function moveSelected(dirId: number | null) {
        const filetered = state.selected.filter(w => ('fileid' in w ? true : w.id !== dirId) && w.dir !== dirId);
        const changedPaths = filetered.map(w => ({ ...w, dir: dirId }));
        const direcs: Directory[] = changedPaths.filter(w => 'fileid' in w ? false : true) as Directory[];
        if (direcs.length > 0) {
            const res = await supabase
                .from('directories')
                .upsert(direcs)
            if (res.error) {
                console.log(res.error);
                return;
            }
        }
        const filesToMove: DirFile[] = changedPaths.filter(w => 'fileid' in w) as DirFile[];

        if (filesToMove.length > 0) {
            // Supabase does not have update many sooo this is quite terrible but working solution.
            // i could just spin a loop with update for each element but that would make many requests.
            const filesToMoveUpdated = filesToMove.map(w => ({
                id: w.id,
                name: w.name,
                created_at: w.created_at,
                size: w.size,
                chanid: w.chanid,
                fileid: w.fileid,
                dir: w.dir,
            }))
            const res = await supabase
                .from('files')
                .upsert(filesToMoveUpdated)
            if (res.error) {
                console.log(res.error);
                return;
            }
        }
        dispatch({
            type: SettingActionType.SET_SELECTED,
            selected: []
        })
        const currDirId: number | null = state.dirHistory.length > 0 ? state.dirHistory[state.dirHistory.length - 1].id : null;
        if (currDirId !== dirId)
            dispatch({
                type: SettingActionType.SET_ITEMS,
                files: state.files.filter(w => filesToMove.findIndex(m => equalDir(m, w)) === -1),
                dirs: state.dirs.filter(w => direcs.findIndex(m => equalDir(m, w)) === -1),
                canNext: state.canNext
            })
        //setFiles(w => [...w.filter(a => !moved.find(b => equalDir(b, a)))]);
        else
            dispatch({
                type: SettingActionType.SET_ITEMS,
                files: [...filesToMove, ...state.files],
                dirs: [...direcs, ...state.dirs],
                canNext: state.canNext
            })
        //setFiles(w => [...w, ...moved]);
    }

    async function deleteSelected() {
        if (!confirm("Files will still be available from links, but won't be visible here anymore. Confirm this choice.")) return;
        const filFiles = state.selected.filter(w => 'fileid' in w);
        const filDirs = state.selected.filter(w => 'fileid' in w ? false : true);
        if (filFiles.length > 0) {
            const res = await supabase
                .from('files')
                .delete()
                .in('id', filFiles.map(w => w.id));
            if (res.error) {
                alert("Failed to delete. " + res.error.message);
                return;
            }
        }
        if (filDirs.length > 0) {
            const res = await supabase
                .from('directories')
                .delete()
                .in('id', filDirs.map(w => w.id));
            if (res.error) {
                console.log(res.error)
                if (res.error.code === '23503') {
                    alert("Failed to delete. Directory contains elements. Please remove them first.");
                } else {
                    alert("Failed to delete. " + res.error.message);
                }
                return;
            }
        }
        dispatch({
            type: SettingActionType.SET_SELECTED,
            selected: []
        });
        dispatch({ type: SettingActionType.RELOAD });
        // await fetchData();
    }

    async function setName(table: 'files' | 'directories', name: string, id: number) {
        const { error } = await supabase
            .from(table)
            .update({ name: MinimizeName(name) })
            .eq("id", id);
        if (error) {
            console.log(error);
            alert(error.message);
        }
    }

    async function updateStateWithPrevDir(urlParams: RouteParams) {
        const id = urlParams.d;
        if (id) {
            // const pdir = await GetPreviousDir(urlParams.d, supabase);
            // if (pdir && pdir.dir) {
            //     dispatch({
            //         type: SettingActionType.SET_FROM_ROUTER,
            //         params: urlParams,
            //         dirs: [pdir.dir, pdir]
            //     });
            //     return;
            // }
            dispatch({
                type: SettingActionType.SET_FROM_ROUTER,
                params: urlParams,
                // id is the only thing that matters other can be anything they will be replaced during fetching because its only one dir
                dirs: [{
                    id,
                    name: '',
                    created_at: '',
                    dir: null,
                    shared: false
                }]
            });
            return;
        }
        dispatch({
            type: SettingActionType.SET_FROM_ROUTER,
            params: urlParams,
            dirs: []
        });
    }

    async function changeSharing(dir: Directory, shared: boolean): Promise<string | undefined> {
        const { error } = await supabase
            .from("directories")
            .update({ shared })
            .eq('id', dir.id);
        return error?.message;
    }

    useEffect(() => {
        router.beforePopState(({ as }) => {
            // console.log(as, router.asPath, router.query);
            if (as !== router.asPath) {
                const urlParams = getRouteParamsFromPath(as);
                updateStateWithPrevDir(urlParams);
                if (props.onBrowserBackForward) props.onBrowserBackForward(as);
            }
            return true;
        });
        if (router.isReady && !routed) {
            setRouted(true);
            const urlParams = getRouterParams(router);
            updateStateWithPrevDir(urlParams);
        }
        return () => {
            router.beforePopState(() => true);
        };
    }, [router])

    return (
        <FilesContext.Provider value={{
            state,
            dispatch,
            addFolder,
            moveSelected,
            deleteSelected,
            setName,
            changeSharing,
            pressedDir,
            pressedBack
        }}>
            {props.children}
        </FilesContext.Provider>
    )
}

export default function useFiles(): ExposedFiles {
    const context = useContext(FilesContext);
    if (!context) throw new Error("Missing FilesContextProvider in parent!");
    return context;
}