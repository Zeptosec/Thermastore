import { FileStatus, Stop } from "@/utils/FileUploader";
import StrechableText from "./StrechableText";
import { BytesToReadable, MinimizeName, TimeToReadable } from "@/utils/FileFunctions";
import Link from "next/link";
import useFileManager from "@/context/FileManagerContext";
import { FileActionType } from "@/context/FileManagerContext";
import IconPlayStopRounded from "@/icons/IconPlayStopRounded";
import IconPlayButtonRounded from "@/icons/IconPlayButtonRounded";

export default function UploadCard({ file, className }: { file: FileStatus, className?: string }) {
    const fm = useFileManager();
    const formattedName = file.formattedName ? file.formattedName : MinimizeName(file.file.name);
    return (
        <div className={`card ${className ? className : ''} relative flex sm:gap-4 justify-between flex-col sm:flex-row overflow-hidden`}>
            {/* terneray hell */}
            {file.finished ? file.errorText.length > 0 ?
                <>
                    <div className="w-full h-full duration-1000 bg-tertiary opacity-60 top-0 left-0 absolute"></div>
                    {file.link.length > 0 ?
                        <Link className="overflow-hidden z-10" href={file.link} target="_blank"><StrechableText text={file.file.name} /></Link>
                        : <StrechableText text={file.file.name} />}
                    <p className="text-tertiary z-10">{file.errorText}</p>
                    <p className="whitespace-nowrap z-10">{BytesToReadable(file.file.size)}</p>
                </> :
                <>
                    <div className="w-full h-full duration-1000 bg-secondary opacity-60 top-0 left-0 absolute"></div>
                    <Link className="overflow-hidden z-10" href={file.link} target="_blank"><StrechableText text={file.file.name} /></Link>
                    <p className="whitespace-nowrap z-10">{BytesToReadable(file.file.size)}</p>
                </> :
                <>
                    <div style={{ width: `${file.uploadedBytes / file.file.size * 100}%` }} className="h-full z-10 duration-1000 bg-tertiary opacity-60 top-0 left-0 absolute"></div>
                    <div className="sm:m-0 flex justify-center overflow-hidden mb-1 z-20"><StrechableText text={formattedName} /></div>
                    {file.errorText.length > 0 ? <p className="text-secondary z-20">{file.errorText}</p> : ""}
                    <div className="flex sm:flex-row text-center sm:text-left z-20 flex-col gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                        {file.uploadedBytes === 0 ? <>
                            <p className="whitespace-nowrap font-bold text-secondary">{file.isPaused ? "Paused" : "Pending..."}</p>
                        </> : <>
                            <p className="whitespace-nowrap">{TimeToReadable(file.timeleft)}</p>
                            <p className="whitespace-nowrap">{BytesToReadable(file.speed)}/s</p>
                            <p className="whitespace-nowrap">{BytesToReadable(file.uploadedBytes)}/{BytesToReadable(file.file.size)}</p>
                        </>}
                        {file.controller.signal.aborted ?
                            <abbr title="Continue upload" className="flex justify-center sm:block cursor-pointer transition-colors duration-200 hover:text-secondary" onClick={() => fm?.dispatch({ type: FileActionType.RESUME_UPLOAD, status: file })}><IconPlayButtonRounded /></abbr> :
                            <abbr title="Pause upload" className="flex justify-center sm:block cursor-pointer transition-colors duration-200 hover:text-secondary" onClick={() => Stop(file, "Upload stopped by user")}><IconPlayStopRounded /></abbr>}
                    </div>
                </>}
        </div>
    )
}