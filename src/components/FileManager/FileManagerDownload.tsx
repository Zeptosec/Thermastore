import { DownloadStatus } from "@/utils/FileDownload"
import StrechableText from "../StrechableText"
import { BytesToReadable, TimeToReadable } from "@/utils/FileFunctions"
import Link from "next/link"
import { useState } from "react"
import IconChevronDown from "@/icons/IconChevronDown"
import IconPlayButtonRounded from "@/icons/IconPlayButtonRounded"
import IconPlayStopRounded from "@/icons/IconPlayStopRounded"
import useFileManager, { FileActionType } from "@/context/FileManagerContext"

interface Props {
    status: DownloadStatus
}

export default function FileManagerDownload({ status }: Props) {
    const [open, setOpen] = useState(false);
    const fm = useFileManager();

    return (
        <div className={`relative grid py-2 border-b px-2 transition-all ${open ? `gap-1` : 'gap-0'} border-quaternary`}>
            <div style={{ width: `${status.downloadedBytes / status.size * 100}%` }} className="h-full z-10 duration-1000 bg-tertiary/40 top-0 left-0 absolute"></div>
            <div className="flex flex-row justify-between gap-2 overflow-hidden">
                <Link href={`/download/${status.channel_id}/${status.fid}`} className="z-20 overflow-hidden cursor-pointer hover:text-tertiary transition-colors">
                    <div className="flex overflow-hidden font-bold">
                        <StrechableText text={status.name} />
                    </div>
                </Link>
                <div className="z-20 flex flex-row text-center sm:text-left gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                    {status.precentage === 1 ? <p>Downloaded!</p> : <>
                        {status.paused ? <p className="whitespace-nowrap text-tertiary font-bold">Paused</p> :
                            status.timeleft < 0 ? <p className="whitespace-nowrap text-tertiary font-bold">Pending...</p> :
                                <p className="whitespace-nowrap">{TimeToReadable(status.timeleft)}</p>}
                        <div onClick={() => setOpen(w => !w)} className={`relative w-6 h-6 cursor-pointer hover:text-tertiary transition-all ${open ? 'rotate-180' : ''}`}>
                            <IconChevronDown className="z-10" />
                        </div>
                    </>}
                </div>
            </div>
            {status.precentage === 1 ? '' : <div className={`flex justify-between transition-all ease-in-out duration-300 gap-1 select-none overflow-hidden ${open ? ' max-h-20  mt-1' : 'max-h-0'}`}>
                <p className="whitespace-nowrap">{BytesToReadable(status.speed)}/s</p>
                <p className="whitespace-nowrap">{BytesToReadable(status.downloadedBytes)}/{BytesToReadable(status.size)}</p>
                {status.abortController ? status.abortController.signal.aborted ?
                    <abbr title="Continue download" className="flex justify-center sm:block cursor-pointer transition-colors duration-200 hover:text-tertiary" onClick={() => {
                        console.log("resume download " + status.name);

                        fm.dispatch({ type: FileActionType.RESUME_DOWNLOAD, status })
                    }}><IconPlayButtonRounded /></abbr> :
                    <abbr title="Pause download" className="flex justify-center sm:block cursor-pointer transition-colors duration-200 hover:text-tertiary" onClick={() => {
                        console.log('abort download ' + status.name);
                        status.abortController?.abort();
                    }}><IconPlayStopRounded /></abbr> : ''}
            </div>}
        </div>
    )
}