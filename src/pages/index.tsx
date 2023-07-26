import { useState } from "react";
import DropComp from "@/components/DropComp";
import styles from "@/styles/Upload.module.css";
import CoolButton from "@/components/CoolButton";
import Head from "next/head";
import useFileManager, { FileActionType, FileToUpload } from "@/context/FileManagerContext";
import UploadCard from "@/components/UploadCard";
import Carousel from "@/components/Carousel";
import Link from "next/link";

const uploadPage = () => {

    const [previewFiles, setPreviewFiles] = useState<Array<File>>([]);
    const [error, setError] = useState("");
    const fm = useFileManager();
    function handleChange(event: any) {
        // cannot get user in this function from 'fm' it gives the initialState always
        let files: any;
        let alerted = false;
        if (event.dataTransfer) {
            files = event.dataTransfer.files;
            const items = event.dataTransfer.items;
            event.preventDefault();
            for (let i = 0; i < items.length; i++) {
                let item = items[i].webkitGetAsEntry();
                if (item) {
                    if (item.isDirectory && !alerted) {
                        alerted = true;
                        alert('Directory uploads not supported here. Go to files page to upload directories');
                        break;
                    }
                }
            }
        } else {
            files = event.target.files;
        }

        if (alerted) return;
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

    async function startUpload() {
        setError("");
        try {
            if (fm) {
                fm.dispatch({ type: FileActionType.UPLOAD, files: previewFiles.map(w => ({ file: w, directory: undefined } as FileToUpload)) })
            }
            setPreviewFiles([]);
            //await uploadFiles(filestatus, onStart, onFinished, user !== null, hook);
        } catch (err: any) {
            if (err.name === "missinghook") {
                setError("Missing a hook somehow...");
            } else
                console.log(err);
        }
    }

    return (
        <div className="bg-primary min-h-screen text-quaternary">
            <Head>
                <title>Thermastore</title>
            </Head>
            <div className="bg-secondary">
                <div className="grid items-center max-w-[1000px] m-auto px-4 gap-4 py-[72px]">
                    <div className="pt-16 pb-8">
                        <h1 className="text-center font-bold text-4xl">Thermastore</h1>
                        <p className="text-center">Fast, free, unlimited cloud storage</p>
                    </div>
                    <div className="overflow-hidden flex justify-center">
                        <Carousel>
                            <div className=" min-w-[215px] max-w-[215px] bg-primary rounded-xl p-2">
                                <h2 className="text-center text-2xl font-bold mb-4">Free</h2>
                                <p className="text-center">This is a completely free and <Link className="hover:text-tertiary transition-colors underline" href="https://github.com/Zeptosec/Thermastore">open source</Link> project!</p>
                            </div>
                            <div className=" min-w-[215px] max-w-[215px] sm:w-[35vw] bg-primary rounded-xl p-2">
                                <h2 className="text-center text-2xl font-bold mb-4">Fast</h2>
                                <p className="text-center">High upload and download speeds. Upload files in no time!</p>
                            </div>
                            <div className=" min-w-[215px] max-w-[215px] bg-primary rounded-xl p-2">
                                <h2 className="text-center text-2xl font-bold mb-4">Playback</h2>
                                <p className="text-center">Watch videos, listen to audio, preview images directly from website without downloading!</p>
                            </div>
                            <div className=" min-w-[215px] max-w-[215px] bg-primary rounded-xl p-2">
                                <h2 className="text-center text-2xl font-bold mb-4">Secure</h2>
                                <p className="text-center">Keep your files directly on your discord server. So that they are only accessible to you and to everyone you share the link to.</p>
                            </div>
                        </Carousel>
                    </div>
                </div>
            </div>
            <div className="relative bg-secondary z-20 py-12">
                <svg preserveAspectRatio="none" className="transition-all absolute bottom-0 -z-10" height={90} width="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path id="wave" fill="currentColor" className="text-primary" fillOpacity="1" d="M0,96L34.3,106.7C68.6,117,137,139,206,138.7C274.3,139,343,117,411,106.7C480,96,549,96,617,112C685.7,128,754,160,823,154.7C891.4,149,960,107,1029,74.7C1097.1,43,1166,21,1234,10.7C1302.9,0,1371,0,1406,0L1440,0L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"></path>
                </svg>
            </div>
            <div className="relative bg-primary">
                <h2 className="text-2xl z-50 font-bold text-center">Start uploading now!</h2>
            </div>
            <div className="grid mt-12 pb-24 bg-primary items-center max-w-[800px] m-auto px-4 gap-4">
                <div className="grid gap-4">
                    <div className={styles.upload}>
                        <DropComp filesChanged={handleChange} files={previewFiles} remove={removeFile} />
                        {previewFiles.length > 0 ? <CoolButton onClick={startUpload}>UPLOAD</CoolButton> : ""}
                        {error.length > 0 ? <h2 className=" text-tertiary font-semibold text-xl text-center">{error}</h2> : ""}
                    </div>
                    {fm && fm.state.uploading.length > 0 ?
                        <div className="grid items-start gap-4">
                            {fm?.state.uploading.map((w, ind) => <UploadCard className="!bg-secondary/60" key={ind} file={w} />)}
                        </div> : ""}
                </div>
            </div>
        </div>
    )
}

export default uploadPage;