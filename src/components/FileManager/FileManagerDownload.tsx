import { DownloadStatus } from "@/utils/FileDownload"
import StrechableText from "../StrechableText"
import { BytesToReadable, TimeToReadable } from "@/utils/FileFunctions"
import Link from "next/link"
import { useState } from "react"

interface Props {
    status: DownloadStatus
}

export default function FileManagerDownload({ status }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`relative grid py-2 border-b px-2 transition-all ${open ? `gap-1` : 'gap-0'} border-quaternary`}>
            <div style={{ width: `${status.downloadedBytes / status.size * 100}%` }} className="h-full z-10 duration-1000 bg-tertiary/40 opacity-60 top-0 left-0 absolute"></div>
            <div className="flex flex-row justify-between gap-2 overflow-hidden">
                <Link href={`/download/${status.channel_id}/${status.fid}`} className="z-20 overflow-hidden cursor-pointer hover:text-secondary transition-colors">
                    <div className="flex overflow-hidden font-bold">
                        <StrechableText text={status.name} />
                    </div>
                </Link>
                <div className="z-20 flex flex-row text-center sm:text-left gap-1 sm:gap-4 items-center justify-between sm:justify-end">
                    {status.precentage === 1 ? <p>Downloaded!</p> : <>
                        <p className="whitespace-nowrap">{TimeToReadable(status.timeleft)}</p>
                        <div onClick={() => setOpen(w => !w)} className="relative w-[22px] h-[22px]">
                            <i className={`gg-chevron-down z-10 w-[22px] h-[22px] cursor-pointer hover:text-tertiary transition-all ${open ? 'rotate-180' : ''}`}></i>
                        </div>
                    </>}
                </div>
            </div>
            {status.precentage === 1 ? '' : <div className={`flex justify-between transition-all ease-in-out duration-300 gap-1 select-none overflow-hidden ${open ? ' max-h-20  mt-1' : 'max-h-0'}`}>
                <p className="whitespace-nowrap">{BytesToReadable(status.speed)}/s</p>
                <p className="whitespace-nowrap">{BytesToReadable(status.downloadedBytes)}/{BytesToReadable(status.size)}</p>
                {/* {status.controller.signal.aborted ?
                    <abbr title="Continue upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-filehover" onClick={() => ContinueDownload()}><i className="gg-play-button-r"></i></abbr> :
                    <abbr title="Pause upload" className="flex justify-center sm:block cursor-pointer text-white transition-colors duration-200 hover:text-lime-400" onClick={() => Stop(status, "Upload stopped by user")}><i className="gg-play-stop-r"></i></abbr>} */}
            </div>}
        </div>
    )
}