import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import BubbleBackground from "@/components/BubbleBackground";
import CoolLoader from "@/components/CoolLoading2";
import { Directory, DirFile } from "@/utils/FileFunctions";
import CoolSearch from "@/components/CoolSearch";
import ShowFiles from "@/components/ShowFiles";

export default function SharedFiles() {
    const router = useRouter();
    const { dirid, time } = router.query;
    const [msg, setMsg] = useState("Loading user...");
    const [stillLoading, setStillLoading] = useState(true);
    const [files, setFiles] = useState<(Directory | DirFile)[]>([]);
    const [dirHistory, setDirHistory] = useState<Directory[]>([]);
    const [dirTimes, setDirTimes] = useState<number[]>([]);
    const [currPage, setCurrPage] = useState(1);
    const [currPageSize, setCurrPageSize] = useState(50);
    const [canNext, setCanNext] = useState<boolean>();
    const [searchStr, setSearchStr] = useState("");
    const [dirname, setDirname] = useState("Loading");

    async function fetchData() {
        if (!dirid) {
            setMsg("Missing directory id");
            return;
        }
        if (!time) {
            setMsg("Missing directory id");
            return;
        }
        let intdir = 0;
        let intime = 0;
        try {
            intdir = parseInt(dirid as string);
            intime = parseInt(time as string);
        } catch (err) {
            console.log(err);
            setMsg("Can't parse query");
            return;
        }
        setStillLoading(true);
        setMsg("Fetching info about files...");
        let dir = intdir;
        if (dirHistory.length > 0) {
            let thedir = dirHistory[dirHistory.length - 1];
            dir = thedir.id;
            intime = new Date(thedir.created_at).getTime();
        }
        if (dirHistory.length > dirTimes.length) {
            setDirTimes(w => [...w, intime]);
        } else if (dirHistory.length < dirTimes.length) {
            setDirTimes(w => w.slice(0, w.length - 1))
        } else {
            setDirTimes(w => [...w.slice(0, w.length - 1), intime])
        }
        try {
            const res = await fetch(`/api/getshared`, {
                method: 'POST',
                body: JSON.stringify({ dirid: dir ?? intdir, searchStr, page: currPage, pageSize: currPageSize, prevFiles: files, time: intime })
            });
            const json = await res.json();
            if (res.ok) {
                setFiles(json.arr);
                setCanNext(json.next);
                setDirname(json.name);
                setStillLoading(false);
            } else {
                setMsg(json.error);
                switch (res.status) {
                    case 404:
                        setDirname("Not found");
                        break;
                    case 400:
                        setDirname("Bad request");
                        break;
                    default:
                        setDirname("Error");
                }
            }
        } catch (err: any) {
            console.log(err);
            setMsg(err.message);
        }
    }

    useEffect(() => {
        fetchData();
        //fetch files
    }, [currPage, searchStr, dirid]);

    useEffect(() => {
        if (searchStr.length > 0) {
            setSearchStr("");
        } else if (currPage === 1)
            fetchData();
        else
            setCurrPage(1);
    }, [dirHistory]);

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
                <title>{dirname}</title>
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
                                {dirHistory.length > 0 ? <abbr title="Back" onClick={() => setDirHistory(w => [...w.slice(0, w.length - 1)])}><i className="gg-arrow-left cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr> : ""}
                            </div>
                            <abbr title="Search for files"><CoolSearch inputChanged={searchChanged} text={searchStr} /></abbr>
                        </div>
                        <ShowFiles
                            files={files}
                            setDirHistory={setDirHistory}
                            selectable={false} />
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