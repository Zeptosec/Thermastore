import { Endpoint, FileStatus, Stop } from "@/utils/FileUploader"
import StrechableText from "../StrechableText"
import { BytesToReadable, TimeToReadable } from "@/utils/FileFunctions"
import { FileActionType, useFileManager } from "@/context/FileManagerContext"
import { useState } from "react"
import Link from "next/link"
import Pathline from "../Pathline"

interface Props {
    status: FileStatus
    user: boolean
    hook?: Endpoint
}

export default function FileManagerUpload({ status, user, hook }: Props) {
    const [open, setOpen] = useState(false);
    const { dispatch }: any = useFileManager();
    function ContinueDownload() {
        dispatch({ type: FileActionType.RESUME_UPLOAD, status, user, hook })
    }


    return (
        <div className={`relative grid py-2 border-b px-2 transition-all ${open ? `gap-1` : 'gap-0'} border-white`}>
            <div style={{ width: `${status.uploadedBytes / status.file.size * 100}%` }} className={`h-full z-10 duration-1000 ${status.finished ? `bg-sky-500/80` : `bg-lime-200/30`} top-0 left-0 absolute`}></div>
            <div className="flex flex-row justify-between gap-2 overflow-hidden">
                {status.finished ?
                    <Link href={`${status.link}`} className="z-20 overflow-hidden transition-colors font-bold hover:text-lime-400">
                        <StrechableText text={status.file.name} />
                    </Link> :
                    <div className="z-20 overflow-hidden font-bold">
                        <StrechableText text={status.file.name} />
                    </div>}
                <div className="z-20 flex flex-row text-center sm:text-left gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                    {open ? "" : status.errorText.length > 0 ?
                        <p className="whitespace-nowrap font-bold text-red-500">{status.errorText}</p> :
                        status.uploadedBytes === 0 ?
                            <p className="whitespace-nowrap font-bold text-lime-300">Pending...</p> :
                            status.finished ?
                                <p className="whitespace-nowrap">{BytesToReadable(status.file.size)}</p> :
                                <p className="whitespace-nowrap">{TimeToReadable(status.timeleft)}</p>}
                    <div onClick={() => setOpen(w => !w)} className="relative w-[22px] h-[22px]">
                        <i className={`gg-chevron-down z-10 text-white w-[22px] h-[22px] cursor-pointer hover:text-lime-400 transition-all ${open ? 'rotate-180' : ''}`}></i>
                    </div>
                </div>
            </div>
            <div className={`z-20 grid gap-2 transition-all overflow-hidden select-none ease-in-out duration-300  ${open ? ' max-h-20  mt-1' : 'max-h-0'}`}>
                {status.errorText.length ?
                    <p className="text-red-500 whitespace-nowrap font-bold text-center">{status.errorText}</p> :
                    status.uploadedBytes === 0 ?
                        <p className="whitespace-nowrap font-bold text-lime-300 text-center">Pending...</p> :
                        status.finished ?
                            <p className="whitespace-nowrap text-center">{BytesToReadable(status.file.size)}</p> :
                            <p className="whitespace-nowrap text-center">{TimeToReadable(status.timeleft)}</p>}
                <div className={`flex justify-between gap-1 `}>
                    {!status.finished ? <>
                        <p className="whitespace-nowrap">{BytesToReadable(status.speed)}/s</p>
                        <p className="whitespace-nowrap">{BytesToReadable(status.uploadedBytes)}/{BytesToReadable(status.file.size)}</p>
                        {status.controller.signal.aborted ?
                            <abbr title="Continue upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-filehover" onClick={() => ContinueDownload()}><i className="gg-play-button-r"></i></abbr> :
                            <abbr title="Pause upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-lime-400" onClick={() => Stop(status, "Upload stopped by user")}><i className="gg-play-stop-r"></i></abbr>}
                    </> : <>
                        <p>Uploaded to <span className="font-bold">{status.directory ? status.directory.name : "C:\\"}</span></p>
                    </>}
                </div>
            </div>
        </div>
    )
}