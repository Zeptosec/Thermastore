import BubbleBackground from "@/components/BubbleBackground";
import CoolLoader from "@/components/CoolLoading2";
import ShowFiles from "@/components/ShowFiles";
import { Directory, DirFile, getFilesWithDir } from "@/utils/FileFunctions";
import { useSessionContext, useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
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
    const [dirHistory, setDirHistory] = useState<number[]>([]);
    const [currPage, setCurrPage] = useState(1);
    const [currPageSize, setCurrPageSize] = useState(50);
    const [selected, setSelected] = useState<(Directory | DirFile)[]>([]);
    const [canNext, setCanNext] = useState<boolean>();

    async function fetchData() {
        setStillLoading(true);
        if (isLoading) return;
        if(!user) router.push("/");
        setMsg("Fetching info about files...");
        const dir = dirHistory.length === 0 ? null : dirHistory[dirHistory.length - 1]
        const { arr, next } = await getFilesWithDir(supabase, dir, currPage, currPageSize, files);
        setFiles(arr);
        setCanNext(next);
        setStillLoading(false);
    }

    useEffect(() => {
        fetchData();
        //fetch files
    }, [isLoading, user, currPage]);

    useEffect(() => {
        if (currPage === 1)
            fetchData();
        else
            setCurrPage(1);
    }, [dirHistory])

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
                    .select('id, name, created_at, dir');
                if (res.error) {
                    alert(res.error)
                } else {
                    setFiles(w => [res.data[0], ...w]);
                }
            }
        }
    }

    async function MoveSelected(dirId: number | null, isHere: boolean) {
        const filetered = selected.filter(w => ('data' in w ? true : w.id !== dirId) && w.dir !== dirId);
        const changedPaths = filetered.map(w => ({ ...w, dir: dirId }));
        const direcs: Directory[] = changedPaths.filter(w => 'data' in w ? false : true) as Directory[];
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

        const filesToMove: DirFile[] = changedPaths.filter(w => 'data' in w) as DirFile[];

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

    return (
        <div>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="grid gap-4">
                    {stillLoading ? <>
                        <CoolLoader />
                        <p className="pt-32 text-2xl text-white text-center">{msg}</p>
                    </> : <>
                        <div className="flex justify-between px-3 h-6">
                            <div className="flex gap-2 items-center">
                                {dirHistory.length > 0 ? <abbr title="Back" onClick={() => setDirHistory(w => [...w.slice(0, w.length - 1)])}><i className="gg-arrow-left cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr> : ""}
                                <abbr title="New directory"><i className="gg-folder-add cursor-pointer transition-colors duration-200 hover:text-blue-700" onClick={() => AddFolder()}></i></abbr>
                            </div>
                            {selected.length > 0 ? <div className="flex gap-2 items-center">
                                <abbr title="Move selected here"><i onClick={() => MoveSelected(dirHistory.length > 0 ? dirHistory[dirHistory.length - 1] : null, true)} className="gg-add-r cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr>
                                <abbr onClick={() => setSelected([])} title="Deselect all"><i className="gg-close-r cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr>
                            </div> : ""}
                        </div>
                        <ShowFiles
                            files={files}
                            setDirHistory={setDirHistory}
                            selected={selected}
                            setSelected={setSelected}
                            MoveSelected={MoveSelected} />
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