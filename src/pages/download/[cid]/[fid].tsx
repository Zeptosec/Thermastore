import CoolButton from "@/components/CoolButton";
import CoolLoader from "@/components/CoolLoading2";
import PreviewFile from "@/components/PreviewFile";
import StrechableText from "@/components/StrechableText";
import useFileManager, { FileActionType } from "@/context/FileManagerContext";
import IconPlayButtonRounded from "@/icons/IconPlayButtonRounded";
import IconPlayStopRounded from "@/icons/IconPlayStopRounded";
import { DownloadStatus, getFileData } from "@/utils/FileDownload";
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
    const fm = useFileManager();

    useEffect(() => {
        if (!fid || !cid || fm.isLoading) return;
        const fetchData = async () => {
            const dt = fm.getDownloading(fid as string);
            if (dt) {
                setFdata(dt);
            } else {
                if (fm.streamers.length === 0) {
                    setLoadError('There are no streamers to use for downloading the file!');
                } else {
                    let data = await getFileData(fid as string, cid as string, fm.streamers, setLoadError);
                    if (data)
                        setFdata(w => ({ ...w, ...data }));
                    else
                        setLoadError("Failed to get file data. All file download services are down! Consider running one locally from https://github.com/Zeptosec/Streamer")
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [fid, cid, fm.isLoading]);

    useEffect(() => {
        if (fData.started_at !== 0)
            return;
        const dt = fm.getDownloading(fid as string);
        if (dt) {
            setFdata(dt);
        }
    }, [fm.state.downloading])

    function download() {
        fm.dispatch({ type: FileActionType.DOWNLOAD, cid: cid as string, fid: fid as string, fData });
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
            {/* <BubbleBackground /> */}
            <div className="grid items-center min-h-screen max-w-[800px] m-auto px-4 gap-4 pt-[140px]">
                <div className="grid gap-4">
                    {loading ? <>
                        <CoolLoader />
                        <p className="text-center pt-4 text-2xl text-red-500">{loadError}</p>
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
                                            <div style={{ width: `${fData.precentage * 100}%` }} className="h-full duration-1000 bg-tertiary/40 top-0 left-0 absolute"></div>
                                            <div className="flex justify-center z-10 overflow-hidden">
                                                <StrechableText text={fData.name} />
                                            </div>
                                            <div className="z-10 flex items-end gap-4 justify-between sm:flex-nowrap flex-wrap">
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
                                                    {fData.abortController ?
                                                        <div className="flex justify-center">{fData.abortController.signal.aborted ?
                                                            <abbr title="Continue download" className="cursor-pointer transition-colors duration-200 hover:text-tertiary" onClick={() => fm.dispatch({ type: FileActionType.RESUME_DOWNLOAD, status: fData })}><IconPlayButtonRounded /></abbr> :
                                                            <abbr title="Pause download" className="cursor-pointer transition-colors duration-200 hover:text-tertiary" onClick={() => fData.abortController?.abort()}><IconPlayStopRounded /></abbr>
                                                        }</div> : ''}
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