import { DownloadStatus } from "@/utils/FileDownload"
import { useState } from "react";

interface Props {
    file: DownloadStatus,
    fid: string,
    cid: string
}

const streams: string[] = [
    'https://streamer.teisingas.repl.co',
    'https://the-streamer-nigerete123.koyeb.app'
]

export default function PreviewFile({ file, fid, cid }: Props) {
    const [sid, setSid] = useState(0);
    function hasExtension(ext: string[]) {
        if (!file.name.includes('.')) return false;
        const parts = file.name.split('.');
        if (ext.includes(parts[parts.length - 1].toLowerCase()))
            return true;
        else
            return false;
    }

    return (
        <div>
            {hasExtension(['mp4', 'mkv', 'mp3', 'wav', 'ogg']) ?
                <>
                    <div className="mb-2 text-black grid items-center justify-center">
                        <select defaultValue={sid} onChange={w => setSid(parseInt(w.target.value))}>
                            {streams.map((w, ind) => (
                                <option key={ind} value={ind}>Stream server: {ind + 1}</option>
                            ))}
                        </select>
                    </div>
                    {hasExtension(['mp4', 'mkv']) ? <div>
                        <video className="w-full outline-none max-h-[800px]" controls controlsList="nodownload" src={`${streams[sid]}/stream/${cid}/${fid}`}></video>
                    </div> : ""}
                    {hasExtension(['mp3', 'wav', 'ogg']) ? <div>
                        <audio className="w-full outline-none" controls controlsList="nodownload" src={`${streams[sid]}/stream/${cid}/${fid}`}></audio>
                    </div> : ""}
                </> : ""}
        </div>
    )
}