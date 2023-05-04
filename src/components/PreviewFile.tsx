import { DownloadStatus, getEarliestEnd, getImageHref } from "@/utils/FileDownload"
import { IsAudioFile, IsImageFile, IsVideoFile } from "@/utils/FileFunctions";
import { Endpoint } from "@/utils/FileUploader";
import { useEffect, useState } from "react";
import { endPoints } from "@/utils/FileFunctions";

interface Props {
    file: DownloadStatus,
    fid: string,
    cid: string
}

const streams: Endpoint[] = endPoints;

export default function PreviewFile({ file, fid, cid }: Props) {
    const [sid, setSid] = useState(0);
    const [href, setHref] = useState("");
    // function hasExtension(ext: string[]) {
    //     if (!file.name.includes('.')) return false;
    //     const parts = file.name.split('.');
    //     if (ext.includes(parts[parts.length - 1].toLowerCase()))
    //         return true;
    //     else
    //         return false;
    // }

    useEffect(() => {

        async function showImage() {
            if (file.size > 1024 ** 2) return;
            const hr = await getImageHref(file, cid);
            setHref(hr);
        }
        if (IsImageFile(file.name))
            showImage();

    }, [])



    return (
        <div>
            {IsVideoFile(file.name) ?
                <>
                    <div className="mb-2 text-black grid items-center justify-center">
                        <select defaultValue={sid} onChange={w => setSid(parseInt(w.target.value))}>
                            {streams.map((w, ind) => (
                                <option key={ind} value={ind}>Stream server: {w.name}</option>
                            ))}
                        </select>
                    </div>
                    {IsVideoFile(file.name) ? <div>
                        <video crossOrigin="" className="w-full outline-none max-h-[800px]" controls controlsList="nodownload" src={`${streams[sid].link}/stream/${cid}/${fid}`}></video>
                    </div> : ""}
                    {IsAudioFile(file.name) ? <div>
                        <audio crossOrigin="" className="w-full outline-none" controls controlsList="nodownload" src={`${streams[sid].link}/stream/${cid}/${fid}`}></audio>
                    </div> : ""}
                </> : ""}
            {(IsImageFile(file.name) && href !== "") ? <div className="grid justify-center">
                <p className="text-center text-2xl pb-4">Preview</p>
                <img src={href} />
            </div> : ""}
        </div>
    )
}