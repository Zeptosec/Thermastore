import { Endpoint, FileStatus, Stop } from "@/utils/FileUploader"
import StrechableText from "../StrechableText"
import { BytesToReadable, MinimizeName, TimeToReadable } from "@/utils/FileFunctions"
import useFileManager, { FileActionType } from "@/context/FileManagerContext"
import { useState } from "react"
import Link from "next/link"
import IconPlayStopRounded from "@/icons/IconPlayStopRounded"
import IconPlayButtonRounded from "@/icons/IconPlayButtonRounded"
import IconChevronDown from "@/icons/IconChevronDown"

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
    const formattedName = status.formattedName ? status.formattedName : MinimizeName(status.file.name);

    return (
        <div className={`relative grid py-2 border-b px-2 transition-all ${open ? `gap-1` : 'gap-0'} border-quaternary`}>
            <div style={{ width: `${status.uploadedBytes / status.file.size * 100}%` }} className={`h-full z-10 duration-1000 ${status.finished ? `bg-secondary/80` : `bg-tertiary/30`} top-0 left-0 absolute`}></div>
            <div className="flex flex-row justify-between gap-2 overflow-hidden">
                {status.finished ?
                    <Link href={`${status.link}`} className="z-20 overflow-hidden transition-colors font-bold hover:text-tertiary">
                        <StrechableText text={formattedName} />
                    </Link> :
                    <div className="z-20 overflow-hidden font-bold">
                        <StrechableText text={formattedName} />
                    </div>}
                <div className="z-20 flex flex-row text-center sm:text-left gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                    {open ? "" : status.errorText.length > 0 ?
                        <p className="whitespace-nowrap font-bold text-quaternary">{status.errorText}</p> :
                        status.uploadedBytes === 0 ?
                            <p className="whitespace-nowrap font-bold text-tertiary">Pending...</p> :
                            status.finished ?
                                <p className="whitespace-nowrap">{BytesToReadable(status.file.size)}</p> :
                                <p className="whitespace-nowrap">{TimeToReadable(status.timeleft)}</p>}
                    <div onClick={() => setOpen(w => !w)} className={`relative w-6 h-6 cursor-pointer hover:text-tertiary transition-all ${open ? 'rotate-180' : ''}`}>
                        <IconChevronDown className="z-10" />
                    </div>
                </div>
            </div>
            <div className={`z-20 grid gap-2 transition-all overflow-hidden select-none ease-in-out duration-300  ${open ? ' max-h-20  mt-1' : 'max-h-0'}`}>
                {status.errorText.length > 0 ?
                    <p className="text-tertiary whitespace-nowrap font-bold text-center">{status.errorText}</p> :
                    status.uploadedBytes === 0 ?
                        <p className="whitespace-nowrap font-bold text-tertiary text-center">Pending...</p> :
                        status.finished ?
                            <p className="whitespace-nowrap text-center">{BytesToReadable(status.file.size)}</p> :
                            <p className="whitespace-nowrap text-center">{TimeToReadable(status.timeleft)}</p>}
                <div className={`flex justify-between gap-1 `}>
                    {!status.finished ? <>
                        <p className="whitespace-nowrap">{BytesToReadable(status.speed)}/s</p>
                        <p className="whitespace-nowrap">{BytesToReadable(status.uploadedBytes)}/{BytesToReadable(status.file.size)}</p>
                        {status.controller.signal.aborted ?
                            <abbr title="Continue upload" className="flex justify-center sm:block cursor-pointer transition-colors duration-200 hover:text-tertiary" onClick={() => ContinueDownload()}><IconPlayButtonRounded /></abbr> :
                            <abbr title="Pause upload" className="flex justify-center sm:block cursor-pointer transition-colors duration-200 hover:text-tertiary" onClick={() => Stop(status, "Upload stopped by user")}><IconPlayStopRounded /></abbr>}
                    </> : <>
                        <p>Uploaded to <span className="font-bold">{status.directory ? status.directory.name : "C:\\"}</span></p>
                    </>}
                </div>
            </div>
        </div>
    )
}