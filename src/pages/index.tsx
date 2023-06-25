import { useState } from "react";
import DropComp from "@/components/DropComp";
import styles from "@/styles/Upload.module.css";
import CoolButton from "@/components/CoolButton";
import BubbleBackground from "@/components/BubbleBackground";
import { Endpoint, FileStatus } from "@/utils/FileUploader";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import Head from "next/head";
import { FileActionType, FileToUpload, useFileManager } from "@/context/FileManagerContext";
import UploadCard from "@/components/UploadCard";

const uploadPage = ({ setIsUploading }: any) => {

    const [previewFiles, setPreviewFiles] = useState<Array<File>>([]);
    const [filesToUpload, setFilesToUpload] = useState<Array<FileStatus>>([]);
    const [hook, setHook] = useState<Endpoint>()
    const [error, setError] = useState("");
    const user = useUser();
    const fm = useFileManager();


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

    async function startUpload() {
        setError("");
        try {
            if (fm) {
                fm.dispatch({ type: FileActionType.UPLOAD, files: previewFiles.map(w => ({ file: w, directory: undefined } as FileToUpload)), user: user !== null, hook })
            }
            setPreviewFiles([]);
            //await uploadFiles(filestatus, onStart, onFinished, user !== null, hook);
        } catch (err: any) {
            if (err.name === "missinghook") {
                if (user) {
                    setError("Go into settings and set up a hook");
                } else {
                    setError("You need to be logged in");
                }
                setFilesToUpload([]);
            } else
                console.log(err);
        }
    }

    return (
        <div>
            <Head>
                <title>Upload</title>
                <meta name="description" content="A free, simple and easy to use cloud storage for your files. Uplaod, backup and share your files with others now." />
            </Head>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="grid gap-4">
                    <div className={styles.upload}>
                        <DropComp filesChanged={handleChange} files={previewFiles} remove={removeFile} />
                        {previewFiles.length > 0 ? <CoolButton onClick={startUpload}>UPLOAD</CoolButton> : ""}
                        {error.length > 0 ? <h2 className="text-red-500 font-semibold text-xl text-center">{error}</h2> : ""}
                    </div>

                    {fm && fm.state.uploading.length > 0 ?
                        <div className="grid items-start gap-4">
                            {fm?.state.uploading.map((w, ind) => <UploadCard key={ind} file={w} />)}
                        </div> : ""}
                </div>
            </div>
        </div>
    )
}

export default uploadPage;