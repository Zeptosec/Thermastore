import { useEffect, useState } from "react";
import DropComp from "@/components/DropComp";
import styles from "@/styles/Upload.module.css";
import CoolButton from "@/components/CoolButton";
import BubbleBackground from "@/components/BubbleBackground";
import { Endpoint, FileStatus, Stop, uploadFiles } from "@/utils/FileUploader";
import { BytesToReadable, chunkSize, TimeToReadable, VerifyHook } from "@/utils/FileFunctions";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import Head from "next/head";
import StrechableText from "@/components/StrechableText";

const uploadPage = ({ setIsUploading }: any) => {

    const [previewFiles, setPreviewFiles] = useState<Array<File>>([]);
    const [filesToUpload, setFilesToUpload] = useState<Array<FileStatus>>([]);
    const [hook, setHook] = useState<Endpoint>()
    const [error, setError] = useState("");
    const router = useRouter();
    const user = useUser();

    function handleChange(files: FileList) {
        setPreviewFiles(w => {
            const list = [...w];
            for (let i = 0; i < files.length; i++) {
                // filter files by name. Reducing repeats
                if (list.findIndex(f => f.name === files[i].name) === -1) {
                    list.push(files[i]);
                }
            }
            list.sort((b, a) => a.size < b.size ? 1 : a.size > b.size ? -1 : 0);
            return list;
        });
    }

    function removeFile(file: File) {
        setPreviewFiles(w => {
            const ind = w.indexOf(file);
            if (ind !== -1) {
                return [...w.slice(0, ind), ...w.slice(ind + 1)];
            }
            console.log("file was not found");
            return w;
        })
    }
    const confMsg = "You are still uploading files"
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

    let interval: NodeJS.Timer | null = null;

    function onFinished() {
        if (interval !== null)
            clearInterval(interval);
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        router.events.off('routeChangeStart', beforeRouteHandler);
        setFilesToUpload(w => [...w]);
        setIsUploading(false);
    }

    function onStart() {
        setIsUploading(true);
        interval = setInterval(() => setFilesToUpload(w => [...w]), 250);
        window.addEventListener('beforeunload', beforeUnloadHandler);
        router.events.on('routeChangeStart', beforeRouteHandler);

    }

    async function startUpload() {
        let filestatus: Array<FileStatus> = previewFiles.map(w => ({
            file: w,
            uploadedBytes: 0,
            uploadedParts: [],
            errorText: "",
            finished: false,
            link: "",
            totalPartsCount: Math.ceil(w.size / chunkSize),
            uploadedPartsCount: 0,
            speed: 0,
            timeleft: 0,
            errorTime: 0,
            controller: new AbortController()
        }));
        setFilesToUpload(w => [...w, ...filestatus])
        setPreviewFiles([]);
        setError("");
        try {
            await uploadFiles(filestatus, onStart, onFinished, user !== null, hook);
        } catch (err: any) {
            if (err.name === "missinghook") {
                if(user){
                    setError("Go into settings and set up a hook");
                } else {
                    setError("You need to be logged in");
                }
                setFilesToUpload([]);
            } else
                console.log(err);
        }
    }

    async function ContinueDownload(w: FileStatus) {
        w.controller = new AbortController();
        await uploadFiles([w], onStart, onFinished, user !== null)
    }

    return (
        <div>
            <Head>
                <title>Upload</title>
            </Head>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="grid gap-4">
                    <div className={styles.upload}>
                        <DropComp filesChanged={handleChange} files={previewFiles} remove={removeFile} />
                        {previewFiles.length > 0 ? <CoolButton onClick={startUpload}>UPLOAD</CoolButton> : ""}
                        {error.length > 0 ? <h2 className="text-red-500 font-semibold text-xl text-center">{error}</h2> : ""}
                    </div>

                    {filesToUpload.length > 0 ?
                        <div className="grid items-start gap-4">
                            {filesToUpload.map((w, ind) => (
                                <div key={ind} className={`card relative flex sm:gap-4 justify-between flex-col sm:flex-row overflow-hidden`}>
                                    {w.finished ? w.errorText.length > 0 ?
                                        <>
                                            <div className="w-full h-full -z-10 duration-1000 bg-red-400 opacity-60 top-0 left-0 absolute"></div>
                                            <StrechableText text={w.file.name} />
                                            <p className="text-red-600">{w.errorText}</p>
                                            <p className="whitespace-nowrap">{BytesToReadable(w.file.size)}</p>
                                        </> :
                                        <>
                                            <div className="w-full h-full -z-10 duration-1000 bg-blue-400 opacity-60 top-0 left-0 absolute"></div>
                                            <Link className="overflow-hidden" href={w.link} target="_blank"><StrechableText text={w.file.name} /></Link>
                                            <p className="whitespace-nowrap">{BytesToReadable(w.file.size)}</p>
                                        </> :
                                        <>
                                            <div style={{ width: `${w.uploadedBytes / w.file.size * 100}%` }} className="h-full -z-10 duration-1000 bg-blue-400 opacity-60 top-0 left-0 absolute"></div>
                                            <div className="sm:m-0 flex justify-center overflow-hidden mb-1"><StrechableText text={w.file.name} /></div>
                                            {w.errorText.length > 0 ? <p>{w.errorText}</p> : ""}
                                            <div className="flex sm:flex-row text-center sm:text-left flex-col gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                                                <p className="whitespace-nowrap">{TimeToReadable(w.timeleft)}</p>
                                                <p className="whitespace-nowrap">{BytesToReadable(w.speed)}/s</p>
                                                <p className="whitespace-nowrap">{BytesToReadable(w.uploadedBytes)}/{BytesToReadable(w.file.size)}</p>
                                                {w.controller.signal.aborted ?
                                                    <abbr title="Continue upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-filehover" onClick={() => ContinueDownload(w)}><i className="gg-play-button-r"></i></abbr> :
                                                    <abbr title="Pause upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-filehover" onClick={() => Stop(w, "Upload stopped by user")}><i className="gg-play-stop-r"></i></abbr>}
                                            </div>
                                        </>}
                                </div>))}
                        </div> : ""}
                </div>
            </div>
        </div>
    )
}

export default uploadPage;