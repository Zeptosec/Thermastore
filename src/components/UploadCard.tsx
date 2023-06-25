import { FileStatus, Stop } from "@/utils/FileUploader";
import StrechableText from "./StrechableText";
import { BytesToReadable, MinimizeName, TimeToReadable } from "@/utils/FileFunctions";
import Link from "next/link";
import { useFileManager } from "@/context/FileManagerContext";
import { FileActionType } from "@/context/FileManagerContext";

export default function UploadCard({ file }: { file: FileStatus }) {
    const fm = useFileManager();
    const formattedName = file.formattedName ? file.formattedName : MinimizeName(file.file.name);
    return (
        <div className={`card relative flex sm:gap-4 justify-between flex-col sm:flex-row overflow-hidden`}>
            {file.finished ? file.errorText.length > 0 ?
                <>
                    <div className="w-full h-full -z-10 duration-1000 bg-red-400 opacity-60 top-0 left-0 absolute"></div>
                    <StrechableText text={file.file.name} />
                    <p className="text-red-600">{file.errorText}</p>
                    <p className="whitespace-nowrap">{BytesToReadable(file.file.size)}</p>
                </> :
                <>
                    <div className="w-full h-full -z-10 duration-1000 bg-blue-400 opacity-60 top-0 left-0 absolute"></div>
                    <Link className="overflow-hidden" href={file.link} target="_blank"><StrechableText text={file.file.name} /></Link>
                    <p className="whitespace-nowrap">{BytesToReadable(file.file.size)}</p>
                </> :
                <>
                    <div style={{ width: `${file.uploadedBytes / file.file.size * 100}%` }} className="h-full -z-10 duration-1000 bg-blue-700 opacity-90 top-0 left-0 absolute"></div>
                    <div className="sm:m-0 flex justify-center overflow-hidden mb-1"><StrechableText text={formattedName} /></div>
                    {file.errorText.length > 0 ? <p className="text-red-500">{file.errorText}</p> : ""}
                    <div className="flex sm:flex-row text-center sm:text-left flex-col gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                        <p className="whitespace-nowrap">{TimeToReadable(file.timeleft)}</p>
                        <p className="whitespace-nowrap">{BytesToReadable(file.speed)}/s</p>
                        <p className="whitespace-nowrap">{BytesToReadable(file.uploadedBytes)}/{BytesToReadable(file.file.size)}</p>
                        {file.controller.signal.aborted ?
                            <abbr title="Continue upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-filehover" onClick={() => fm?.dispatch({ type: FileActionType.RESUME_UPLOAD, status: file, user: true })}><i className="gg-play-button-r"></i></abbr> :
                            <abbr title="Pause upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-filehover" onClick={() => Stop(file, "Upload stopped by user")}><i className="gg-play-stop-r"></i></abbr>}
                    </div>
                </>}
        </div>
    )
}