import { DownloadStatus } from "@/utils/FileDownload"

interface Props {
    file: DownloadStatus,
    id: string
}

export default function PreviewFile({ file, id }: Props) {

    function hasExtension(ext: string) {
        if (!file.name.includes('.')) return false;
        const parts = file.name.split('.');
        if (parts[parts.length - 1].toLowerCase() === ext)
            return true;
        else
            return false;
    }

    return (
        <div>
            {hasExtension('mp4') ? <div>
                <video className="w-full outline-none" controls controlsList="nodownload" src={`https://the-streamer-nigerete123.koyeb.app/stream/${id}`}></video>
            </div> : ""}
            {hasExtension('mp3') ? <div>
                <audio className="w-full outline-none" controls controlsList="nodownload" src={`https://the-streamer-nigerete123.koyeb.app/stream/${id}`}></audio>
            </div> : ""}
        </div>
    )
}