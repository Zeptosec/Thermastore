import { DownloadStatus } from "@/utils/FileDownload"

interface Props {
    file: DownloadStatus,
    id: string
}

export default function PreviewFile({ file, id }: Props) {

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
                <video className="w-full outline-none" controls controlsList="nodownload" src={`http://localhost:8000/stream/${id}`}></video>
            </div> : ""}
            {hasExtension(['mp3', 'wav', 'ogg']) ? <div>
                <audio className="w-full outline-none" controls controlsList="nodownload" src={`https://the-streamer-nigerete123.koyeb.app/stream/${id}`}></audio>
            </div> : ""}
        </div>
    )
}