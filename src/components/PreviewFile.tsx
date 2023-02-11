import { DownloadStatus } from "@/utils/FileDownload"

interface Props {
    file: DownloadStatus,
    fid: string,
    cid: string
}

export default function PreviewFile({ file, fid, cid }: Props) {

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
            {hasExtension(['mp4', 'mkv']) ? <div>
                <video className="w-full outline-none max-h-[800px]" controls controlsList="nodownload" src={`https://the-streamer-nigerete123.koyeb.app/stream/${cid}/${fid}`}></video>
            </div> : ""}
            {hasExtension(['mp3', 'wav', 'ogg']) ? <div>
                <audio className="w-full outline-none" controls controlsList="nodownload" src={`https://the-streamer-nigerete123.koyeb.app/stream/${cid}/${fid}`}></audio>
            </div> : ""}
        </div>
    )
}