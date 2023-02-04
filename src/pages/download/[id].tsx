import BubbleBackground from "@/components/BubbleBackground";
import CoolButton from "@/components/CoolButton";
import CoolLoader from "@/components/CoolLoading2";
import PreviewFile from "@/components/PreviewFile";
import { downloadFile, DownloadStatus, getFileData } from "@/utils/FileDownload";
import { BytesToReadable, TimeToReadable } from "@/utils/FileFunctions";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function downloadPage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [fData, setFdata] = useState<DownloadStatus>({ name: "", size: -1, chunks: [], downloadedBytes: 0, speed: 0, timeleft: 0, precentage: 0 });

    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            let data = await getFileData(id as string, setLoadError);
            if (data)
                setFdata(w => ({ ...w, ...data }));
            setLoading(false);
        }
        fetchData();
    }, [id]);

    const confMsg = "You are still downloading the file!"
    function beforeUnloadHandler(e: BeforeUnloadEvent) {
        (e || window.event).returnValue = confMsg;
        return confMsg;
    }

    function beforeRouteHandler(url: string) {
        if (router.pathname !== url && !confirm(confMsg)) {
            router.events.emit('routeChangeError');
            throw `Route change to "${url}" was aborted (this error can be safely ignored).`
        }
    }

    function onFinished() {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        router.events.off('routeChangeStart', beforeRouteHandler);
    }

    function onStart() {
        window.addEventListener('beforeunload', beforeUnloadHandler);
        router.events.on('routeChangeStart', beforeRouteHandler);

    }

    async function download() {
        setDownloading(true);
        await downloadFile(fData, setFdata, onStart, onFinished);
    }

    return (
        <div>
            <Head>
                <title>Download {fData.name}</title>
            </Head>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4">
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
                                {!downloading ? <>
                                    <div className="card flex justify-between">
                                        <p>{fData.name}</p>
                                        <p>{BytesToReadable(fData.size)}</p>
                                    </div>
                                    <CoolButton onClick={download}>DOWNLOAD</CoolButton>
                                </> :
                                    <>
                                        <div className="card flex sm:justify-between relative flex-col sm:flex-row items-center">
                                            <div style={{ width: `${fData.precentage * 100}%` }} className="h-full -z-10 duration-1000 bg-blue-400 opacity-60 top-0 left-0 absolute"></div>
                                            <p>{fData.name}</p>
                                            <div className="flex items-end gap-4">
                                                <p>{TimeToReadable(fData.timeleft)}</p>
                                                <p>{BytesToReadable(fData.speed)}/s</p>
                                                <p>{BytesToReadable(fData.downloadedBytes)}/{BytesToReadable(fData.size)}</p>
                                            </div>
                                        </div>
                                    </>}
                                    {(id && !Array.isArray(id)) ? <PreviewFile file={fData} id={id} /> : ""}
                            </>
                    }
                </div>
            </div>
        </div>
    )
}