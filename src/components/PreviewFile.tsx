import { DownloadStatus, getImageHref } from "@/utils/FileDownload"
import { useEffect, useState } from "react";

interface Props {
    file: DownloadStatus,
    fid: string,
    cid: string
}

const streams: string[] = [
    'https://thestr.onrender.com',
    'https://streamer.teisingas.repl.co',
    'https://long-succulent-carbon.glitch.me',
    'https://the-streamer-nigerete123.koyeb.app',
]

export default function PreviewFile({ file, fid, cid }: Props) {
    const [sid, setSid] = useState(0);
    const [href, setHref] = useState("");
    function hasExtension(ext: string[]) {
        if (!file.name.includes('.')) return false;
        const parts = file.name.split('.');
        if (ext.includes(parts[parts.length - 1].toLowerCase()))
            return true;
        else
            return false;
    }

    useEffect(() => {
        async function showImage() {
            if (file.size > 1024 ** 2) return;
            const hr = await getImageHref(file, cid);
            setHref(hr);
        }
        if (hasExtension(['png', 'jpg', 'jpeg', 'gif', 'bmp']))
            showImage();
    }, [])



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
            {(hasExtension(['png', 'jpg', 'jpeg', 'gif', 'bmp']) && href !== "") ? <div className="grid justify-center">
                <p className="text-center text-2xl pb-4">Preview</p>
                <img src={href} />
            </div> : ""}
        </div>
    )
}