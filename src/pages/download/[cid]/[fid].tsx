import BubbleBackground from "@/components/BubbleBackground";
import CoolButton from "@/components/CoolButton";
import CoolLoader from "@/components/CoolLoading2";
import PreviewFile from "@/components/PreviewFile";
import StrechableText from "@/components/StrechableText";
import { FileActionType, useFileManager } from "@/context/FileManagerContext";
import { downloadFile, DownloadStatus, getFileData } from "@/utils/FileDownload";
import { BytesToReadable, TimeToReadable } from "@/utils/FileFunctions";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function downloadPage() {
    const router = useRouter();
    const { fid, cid } = router.query;
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [fData, setFdata] = useState<DownloadStatus>({ started_at: 0, name: "", size: -1, chunks: [], downloadedBytes: 0, speed: 0, timeleft: 0, precentage: 0, channel_id: "1025526944776867952" });
    const [downloading, setDownloading] = useState(false);
    const fm = useFileManager();

    useEffect(() => {
        if (!fid || !cid) return;
        const fetchData = async () => {
            const dt = fm?.getDownloading(fid as string);
            if (dt) {
                setFdata(dt);
            } else {
                let data = await getFileData(fid as string, cid as string, setLoadError);
                if (data)
                    setFdata(w => ({ ...w, ...data }));
            }
            setLoading(false);
        }
        fetchData();
    }, [fid, cid]);

    // const confMsg = "You are still downloading the file!"
    // function beforeUnloadHandler(e: BeforeUnloadEvent) {
    //     (e || window.event).returnValue = confMsg;
    //     return confMsg;
    // }

    // function beforeRouteHandler(url: string) {
    //     if (router.pathname !== url && !confirm(confMsg)) {
    //         router.events.emit('routeChangeError');
    //         throw `Route change to "${url}" was aborted (this error can be safely ignored).`
    //     }
    // }

    // function onFinished() {
    //     window.removeEventListener('beforeunload', beforeUnloadHandler);
    //     router.events.off('routeChangeStart', beforeRouteHandler);
    // }

    // function onStart() {
    //     window.addEventListener('beforeunload', beforeUnloadHandler);
    //     router.events.on('routeChangeStart', beforeRouteHandler);

    // }

    useEffect(() => {
        if (fData.started_at !== 0)
            return;
        const dt = fm?.getDownloading(fid as string);
        if (dt) {
            setFdata(dt);
        }
    }, [fm?.state.downloading])

    function download() {
        // setDownloading(true);
        fm?.dispatch({ type: FileActionType.DOWNLOAD, cid: cid as string, fid: fid as string, fData });
        //setFdata(w => ({ ...w, started_at: new Date().getTime() }))
        //await downloadFile(fData, setFdata, onStart, onFinished);
    }

    return (
        <div>
            <Head>
                {(!loading && loadError.length === 0) ?
                    <title>{fData.name}</title> :
                    <title>Download</title>
                }
                <meta property="og:description" key="desc" content="Download or preview this file" />
            </Head>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="grid gap-4">
                    {loading ? <>
                        <CoolLoader />
                        <p className="text-center pt-32 text-2xl text-red-500">{loadError}</p>
                    </> :
                        loadError.length > 0 ? <>
                            <div className="card justify-center">
                                <p className="text-center text-red-600">{loadError}</p>
                            </div>
                        </> :
                            <>
                                {fData.started_at === 0 ? <>
                                    <div className="card flex justify-between gap-2 overflow-hidden">
                                        <StrechableText text={fData.name} />
                                        <p className="whitespace-nowrap">{BytesToReadable(fData.size)}</p>
                                    </div>
                                    <CoolButton onClick={download}>DOWNLOAD</CoolButton>
                                </> :
                                    <>
                                        <div className="card overflow-hidden flex sm:justify-between relative flex-col gap-2 sm:flex-row">
                                            <div style={{ width: `${fData.precentage * 100}%` }} className="h-full duration-1000 bg-blue-400 opacity-60 top-0 left-0 absolute"></div>
                                            <div className="flex justify-center z-10">
                                                <StrechableText text={fData.name} />
                                            </div>
                                            <div className="z-10 flex items-end gap-4 justify-center">
                                                {fData.failed_text ? <p className=" text-red-700 whitespace-nowrap">
                                                    {fData.failed_text}
                                                </p> : fData.timeleft < 0 ? <p className="whitespace-nowrap">
                                                    Waiting for servers. <span className="font-bold">{TimeToReadable((new Date().getTime() - fData.started_at) / 1000)}</span> passed since started.
                                                </p> : fData.precentage === 1 ? <p>
                                                    Downloaded!
                                                </p> : <>
                                                    <p className="whitespace-nowrap">{TimeToReadable(fData.timeleft)}</p>
                                                    <p className="whitespace-nowrap">{BytesToReadable(fData.speed)}/s</p>
                                                    <p className="whitespace-nowrap">{BytesToReadable(fData.downloadedBytes)}/{BytesToReadable(fData.size)}</p>
                                                </>}
                                            </div>
                                        </div>
                                    </>}
                                {(fid && !Array.isArray(fid) && cid && !Array.isArray(cid)) ? <PreviewFile file={fData} fid={fid} cid={cid} /> : ""}
                            </>
                    }
                </div>
            </div>
        </div>
    )
}