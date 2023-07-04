import AnimatedDropZone from "@/components/AnimatedDropZone";
import BubbleBackground from "@/components/BubbleBackground";
import CoolLoader from "@/components/CoolLoading2";
import CoolSearch from "@/components/CoolSearch";
import Pathline from "@/components/Pathline";
import ShowFiles from "@/components/ShowFiles";
import { useFileManager } from "@/context/FileManagerContext";
import IconUpload from "@/icons/IconUpload";
import { AddFolder, Directory, DirFile, equalDir, getFilesWithDir, GetPreviousDir, PageDirCountHistory, UpFiles } from "@/utils/FileFunctions";
import { FileStatus } from "@/utils/FileUploader";
import { useSessionContext, useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import Head from "next/head";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";

export default function filesPage() {
    const { isLoading, session, error } = useSessionContext();
    const user = useUser();
    const router = useRouter();
    const supabase = useSupabaseClient();
    const fm = useFileManager();
    const [msg, setMsg] = useState("Loading user...");
    const [stillLoading, setStillLoading] = useState(true);
    const [files, setFiles] = useState<(Directory | DirFile)[]>([]);
    const [dirHistory, setDirHistory] = useState<Directory[]>([]);
    const [currPage, setCurrPage] = useState(1);
    const [currPageSize, setCurrPageSize] = useState(50);
    const [selected, setSelected] = useState<(Directory | DirFile)[]>([]);
    const [canNext, setCanNext] = useState<boolean>();
    const [searchStr, setSearchStr] = useState("");
    const [isGlobal, setIsGlobal] = useState(false);
    const [gotRouteDir, setGotRouteDir] = useState(false);
    const [pageDirHistory, setPageDirHistory] = useState<PageDirCountHistory>({ counts: [], pageSize: currPageSize, totalCnt: 0 })
    const [dragging, setDragging] = useState(false);
    const [uploadingHere, setUploadingHere] = useState<FileStatus[]>([]);

    async function fetchData() {
        setStillLoading(true);
        if (isLoading) return;
        if (!user) router.push("/");
        setMsg("Fetching info about files...");
        const dir = dirHistory.length === 0 ? null : dirHistory[dirHistory.length - 1].id
        const { arr, next } = await getFilesWithDir(supabase, dir, currPage, currPageSize, pageDirHistory, searchStr, isGlobal);
        setFiles(arr);
        setCanNext(next);
        setStillLoading(false);
        // get uploading files to show here
        UpdateUploadingFiles();
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
                    setDirHistory([pdir.dir, pdir]);
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
                rt += `?d=${dirHistory[dirHistory.length - 1].id}`;
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

    async function setDirFromUrl(rdir: any) {
        if (rdir && !Array.isArray(rdir)) {
            try {
                const dirnum = parseInt(rdir);
                if (isNaN(dirnum)) {
                    setDirHistory([])
                    return;
                }
                const ind = dirHistory.findIndex(w => w.id === dirnum);
                if (ind === -1) {
                    const pdir = await GetPreviousDir(dirnum, supabase);
                    if (pdir) {
                        setDirHistory([pdir]);
                    } else
                        setDirHistory([{ id: dirnum, name: "", created_at: "", shared: false, dir: 0 }]);
                }
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
        UpdateUploadingFiles();
        if (!isHere)
            setFiles(w => [...w.filter(a => !moved.find(b => equalDir(b, a)))]);
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

    /**
     * Function that gets files that are uploading in the current folder
     */
    function UpdateUploadingFiles() {
        const currDir = dirHistory[dirHistory.length - 1];
        const filesHere = fm?.state.uploading.filter(w => {
            const cid = currDir ? currDir.id : null;
            const tid = w.directory ? w.directory.id : null;
            return cid === tid && !w.finished;
        });
        if (filesHere)
            setUploadingHere(filesHere);
        else
            setUploadingHere([]);
    }

    useEffect(UpdateUploadingFiles, [fm?.state.uploading])

    function UploadToDir(direc: Directory, event: any) {
        UpFiles(event, direc, dirHistory, setFiles, user !== null, fm);
    }
    return (
        <div>
            <Head>
                <title>{dirHistory.length > 0 ? `Files - ${dirHistory[dirHistory.length - 1].name}` : 'Files'}</title>
            </Head>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="grid gap-4 pb-4">
                    {stillLoading ? <>
                        <CoolLoader />
                        <p className="pt-32 text-2xl text-white text-center">{msg}</p>
                    </> : <>
                        <Pathline dirHistory={dirHistory} setDirHistory={setDirHistory} />
                        <div className="flex justify-between px-3 h-6">
                            <div className="flex gap-2 items-center">
                                {dirHistory.length > 0 ? <abbr title="Back" onClick={() => setDirHistory(w => w.slice(0, w.length - 1))}><i className="gg-arrow-left cursor-pointer transition-colors duration-200 text-white hover:text-filehover"></i></abbr> : ""}
                                <abbr title="New directory">
                                    <i className="gg-folder-add cursor-pointer transition-colors duration-200 text-white hover:text-filehover" onClick={() => AddFolder(dirHistory, setFiles)}></i>
                                </abbr>
                                <abbr title="Upload here">
                                    <label htmlFor="file-uploader" className="transition-colors duration-200 text-white hover:text-filehover cursor-pointer ">
                                        <IconUpload />
                                    </label>
                                </abbr>
                            </div>
                            {selected.length > 0 ? <div className="flex gap-2 items-center">
                                <abbr className="cursor-pointer transition-colors duration-200 hover:text-filehover w-[22px] h-[22px] flex justify-center items-center" title="Move selected here"><i onClick={() => MoveSelected(dirHistory.length > 0 ? dirHistory[dirHistory.length - 1].id : null, true)} className="gg-add-r"></i></abbr>
                                <abbr className="cursor-pointer transition-colors duration-200 hover:text-filehover w-[22px] h-[22px] flex justify-center items-center" onClick={() => setSelected([])} title="Deselect all"><i className="gg-close-r"></i></abbr>
                                <abbr className="cursor-pointer transition-colors duration-200 hover:text-filehover w-[22px] h-[22px] flex justify-center items-center" onClick={() => deleteSelected()} title="Delete selected"><i className="gg-trash"></i></abbr>
                            </div> : ""}
                            <div className="flex items-center gap-2">
                                <abbr title="Search for files"><CoolSearch inputChanged={searchChanged} text={searchStr} /></abbr>
                                <abbr onClick={() => setIsGlobal(w => !w)} className={`cursor-pointer transition-colors duration-200 ${isGlobal ? "text-green-700 hover:text-green-800" : "text-red-500 hover:text-red-600"}`} title={`Global search is ${isGlobal ? "enabled" : "disabled"}`}><i className="gg-globe-alt"></i></abbr>
                            </div>
                        </div>
                        {/* <div className="grid gap-4 pb-4"> */}
                        <AnimatedDropZone
                            dragging={dragging}
                            setDragging={setDragging}
                            dropped={(event: any) => UploadToDir(dirHistory[dirHistory.length - 1], event)}
                        >
                            <div className="grid gap-2">
                                <ShowFiles
                                    files={files}
                                    setDirHistory={setDirHistory}
                                    selected={selected}
                                    setSelected={setSelected}
                                    MoveSelected={MoveSelected}
                                    selectable={true}
                                    fs={uploadingHere}
                                    dropped={UploadToDir}
                                />
                                {currPage > 1 || canNext ? <div className={`flex justify-between items-center px-3`}>
                                    <div>
                                        {currPage > 1 ? <div className=" cursor-pointer transition-colors duration-200 hover:text-filehover">
                                            <abbr title="Previous page">
                                                <i onClick={() => setCurrPage(w => w - 1)} className="gg-arrow-left"></i>
                                            </abbr>
                                        </div> : ""}
                                    </div>
                                    <div>
                                        {canNext ? <div className=" cursor-pointer transition-colors duration-200 hover:text-filehover">
                                            <abbr title="Next page">
                                                <i onClick={() => setCurrPage(w => w + 1)} className="gg-arrow-right"></i>
                                            </abbr>
                                        </div> : ""}
                                    </div>
                                </div> : ""}
                            </div>
                        </AnimatedDropZone>
                        {/* </div> */}
                    </>}
                </div>
            </div>
        </div >
    )
}