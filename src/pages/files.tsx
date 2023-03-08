import BubbleBackground from "@/components/BubbleBackground";
import CoolLoader from "@/components/CoolLoading2";
import CoolSearch from "@/components/CoolSearch";
import ShowFiles from "@/components/ShowFiles";
import { Directory, DirFile, getFilesWithDir, GetPreviousDir } from "@/utils/FileFunctions";
import { useSessionContext, useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function filesPage() {
    const { isLoading, session, error } = useSessionContext();
    const user = useUser();
    const router = useRouter();
    const supabase = useSupabaseClient();
    const [msg, setMsg] = useState("Loading user...");
    const [stillLoading, setStillLoading] = useState(true);
    const [files, setFiles] = useState<(Directory | DirFile)[]>([]);
    const [dirHistory, setDirHistory] = useState<Directory[]>([]);
    const [callDirUpdate, setCallDirUpdate] = useState(true)
    const [currPage, setCurrPage] = useState(1);
    const [currPageSize, setCurrPageSize] = useState(50);
    const [selected, setSelected] = useState<(Directory | DirFile)[]>([]);
    const [canNext, setCanNext] = useState<boolean>();
    const [searchStr, setSearchStr] = useState("");
    const [isGlobal, setIsGlobal] = useState(false);
    const [gotRouteDir, setGotRouteDir] = useState(false);

    async function fetchData() {
        setStillLoading(true);
        if (isLoading) return;
        if (!user) router.push("/");
        setMsg("Fetching info about files...");
        const dir = dirHistory.length === 0 ? null : dirHistory[dirHistory.length - 1].id
        const { arr, next } = await getFilesWithDir(supabase, dir, currPage, currPageSize, files, searchStr, isGlobal);
        setFiles(arr);
        setCanNext(next);
        setStillLoading(false);
    }

    useEffect(() => {
        if (gotRouteDir)
            fetchData();
        //fetch files
    }, [isLoading, currPage, searchStr]);

    useEffect(() => {
        async function asyncEffect() {
            if (dirHistory.length === 1) {
                const pdir = await GetPreviousDir(dirHistory[0].id, supabase);
                if (pdir && pdir.dir) {
                    setDirHistory(w => [pdir, ...w]);
                    return;
                }
            }
            if (searchStr.length > 0) {
                setSearchStr("");
            } else if (currPage === 1)
                fetchData();
            else
                setCurrPage(1);
            let rt = '/files';
            if (dirHistory.length > 0)
                rt += `?d=${dirHistory[dirHistory.length - 1]}`;
            router.push(rt, undefined, { shallow: true });
        }
        if (gotRouteDir)
            asyncEffect();
    }, [dirHistory]);

    useEffect(() => {
        if (searchStr.length > 0 && gotRouteDir) {
            fetchData();
        }
    }, [isGlobal]);

    useEffect(() => {
        //console.log(router);
        router.beforePopState(({ as }) => {
            if (as !== router.asPath) {
                const parts = as.split("?");
                if (parts.length > 1) {
                    const urlParams = new URLSearchParams(parts[1]);
                    setDirFromUrl(urlParams.get('d'));
                } else {
                    setDirFromUrl(null);
                }
            }
            return true;
        });
        if (router.isReady) {
            if (gotRouteDir) return;
            setGotRouteDir(true);
            const rdir = router.query.d;
            setDirFromUrl(rdir);
        }
        return () => {
            router.beforePopState(() => true);
        };
    }, [router])

    function setDirFromUrl(rdir: any) {
        if (rdir && !Array.isArray(rdir)) {
            try {
                const dirnum = parseInt(rdir);
                if (isNaN(dirnum)) {
                    setDirHistory([])
                    return;
                }
                const ind = dirHistory.findIndex(w => w.id === dirnum);
                if (ind === -1)
                    setDirHistory([{ id: dirnum, name: "", created_at: "", shared: false, dir: 0 }]);
                else
                    setDirHistory(w => w.slice(0, ind + 1))
            } catch (err) {
                console.log("err");
                setDirHistory([]);
                console.log(err);
            }
        } else {
            setDirHistory([]);
        }
    }

    async function AddFolder() {
        let name = prompt("Directory name", "Folder");
        if (name) {
            if (name.length < 3) {
                alert("Directory name is too short");
            } else if (name.length > 24) {
                alert("Directory name is too long");
            } else {
                const dir = dirHistory.length > 0 ? dirHistory[dirHistory.length - 1] : null;
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
                    console.log(res.data);
                    setFiles(w => [res.data[0], ...w]);
                }
            }
        }
    }

    async function MoveSelected(dirId: number | null, isHere: boolean) {
        const filetered = selected.filter(w => ('fileid' in w ? true : w.id !== dirId) && w.dir !== dirId);
        const changedPaths = filetered.map(w => ({ ...w, dir: dirId }));
        const direcs: Directory[] = changedPaths.filter(w => 'fileid' in w ? false : true) as Directory[];
        let moved: (Directory | DirFile)[] = [];
        if (direcs.length > 0) {
            const res = await supabase
                .from('directories')
                .upsert(direcs)
            if (res.error) {
                console.log(res.error);
                return;
            }
            moved.push(...direcs);
        }

        const filesToMove: DirFile[] = changedPaths.filter(w => 'fileid' in w) as DirFile[];

        if (filesToMove.length > 0) {
            const res = await supabase
                .from('files')
                .upsert(filesToMove)
            if (res.error) {
                console.log(res.error);
                return;
            }
            moved.push(...filesToMove);
        }
        if (!isHere)
            setFiles(w => [...w.filter(a => !moved.find(b => b.created_at === a.created_at))]);
        else
            setFiles(w => [...w, ...moved]);
        setSelected([]);
    }

    async function deleteSelected() {
        if (!confirm("Files will still be available from links, but won't be visible here anymore. Confirm this choice.")) return;
        const filFiles = selected.filter(w => 'fileid' in w);
        const filDirs = selected.filter(w => 'fileid' in w ? false : true);
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
        setSelected([]);
        await fetchData();
    }

    const [interval, setInterval] = useState<null | NodeJS.Timeout>(null);
    function searchChanged(str: string) {
        if (interval) {
            clearTimeout(interval);
        }
        setInterval(setTimeout(() => {
            setSearchStr(str);
            setCurrPage(1);
        }, 1500))
    }

    return (
        <div>
            <Head>
                <title>Files</title>
            </Head>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="grid gap-4">
                    {stillLoading ? <>
                        <CoolLoader />
                        <p className="pt-32 text-2xl text-white text-center">{msg}</p>
                    </> : <>
                        <div className="flex justify-between px-3 h-6">
                            <div className="flex gap-2 items-center">
                                {dirHistory.length > 0 ? <abbr title="Back" onClick={() => setDirHistory(w => w.slice(0, w.length - 1))}><i className="gg-arrow-left cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr> : ""}
                                <abbr title="New directory"><i className="gg-folder-add cursor-pointer transition-colors duration-200 hover:text-blue-700" onClick={() => AddFolder()}></i></abbr>
                            </div>
                            {selected.length > 0 ? <div className="flex gap-2 items-center">
                                <abbr className="cursor-pointer transition-colors duration-200 hover:text-blue-700 w-[22px] h-[22px] flex justify-center items-center" title="Move selected here"><i onClick={() => MoveSelected(dirHistory.length > 0 ? dirHistory[dirHistory.length - 1].id : null, true)} className="gg-add-r"></i></abbr>
                                <abbr className="cursor-pointer transition-colors duration-200 hover:text-blue-700 w-[22px] h-[22px] flex justify-center items-center" onClick={() => setSelected([])} title="Deselect all"><i className="gg-close-r"></i></abbr>
                                <abbr className="cursor-pointer transition-colors duration-200 hover:text-blue-700 w-[22px] h-[22px] flex justify-center items-center" onClick={() => deleteSelected()} title="Delete selected"><i className="gg-trash"></i></abbr>
                            </div> : ""}
                            <div className="flex items-center gap-2">
                                <abbr title="Search for files"><CoolSearch inputChanged={searchChanged} text={searchStr} /></abbr>
                                <abbr onClick={() => setIsGlobal(w => !w)} className={`cursor-pointer transition-colors duration-200 ${isGlobal ? "text-green-700 hover:text-green-800" : "text-red-500 hover:text-red-600"}`} title={`Global search is ${isGlobal ? "enabled" : "disabled"}`}><i className="gg-globe-alt"></i></abbr>
                            </div>
                        </div>
                        <ShowFiles
                            files={files}
                            setDirHistory={setDirHistory}
                            selected={selected}
                            setSelected={setSelected}
                            MoveSelected={MoveSelected}
                            selectable={true} />
                        <div className="flex justify-between items-center px-3">
                            <div>
                                {currPage > 1 ? <i onClick={() => setCurrPage(w => w - 1)} className="gg-arrow-left cursor-pointer transition-colors duration-200 hover:text-blue-700"></i> : ""}
                            </div>
                            <div>
                                {canNext ? <i onClick={() => setCurrPage(w => w + 1)} className="gg-arrow-right cursor-pointer transition-colors duration-200 hover:text-blue-700"></i> : ""}
                            </div>
                        </div>
                    </>}
                </div>
            </div>
        </div>
    )
}