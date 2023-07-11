import { DownloadStatus, getEarliestEnd, getImage, getImageHref, getImagePreviewHref } from "@/utils/FileDownload"
import { getFileType, DirFile, FileType } from "@/utils/FileFunctions";
import { Endpoint } from "@/utils/FileUploader";
import { useEffect, useState } from "react";
import { endPoints } from "@/utils/FileFunctions";

interface Props {
    file?: DownloadStatus,
    dirFile?: DirFile,
    fid: string,
    cid: string
}

const streams: Endpoint[] = endPoints;

export default function PreviewFile({ file, fid, cid, dirFile }: Props) {
    const [sid, setSid] = useState(0);
    const [href, setHref] = useState("");
    const fileType: FileType = file ? getFileType(file.name) : dirFile ? getFileType(dirFile.name) : 'file';
    useEffect(() => {
        async function getFastestRespond() {
            const fastestEnd = await getEarliestEnd(endPoints, async (rs) => rs.status === 200)
            const ind = endPoints.indexOf(fastestEnd);
            if (ind !== -1) {
                setSid(ind);
            }
        }
        async function showImage() {
            const limit = 1024 ** 2;
            if (file && file.size <= limit) {
                try {
                    const hr = await getImageHref(file, cid);
                    setHref(hr);
                } catch (err) {
                    console.error(err);
                    alert("File not found!");
                }
            } else if (dirFile) {
                if (dirFile.size <= limit) {
                    const hr = await getImage(dirFile.chanid, dirFile.fileid);
                    setHref(hr);
                } else if (dirFile.previews) {
                    const hr = await getImagePreviewHref(dirFile);
                    setHref(hr);
                }
            }
        }
        if (fileType === 'image')
            showImage();
        if (['video', 'audio'].includes(fileType)) {
            getFastestRespond();
        }
        return () => {
            if (href.length > 0) {
                URL.revokeObjectURL(href);
            }
        }
    }, [])


    return (
        <div>
            {['video', 'audio'].includes(fileType) ?
                <>
                    <div className="mb-2 text-black grid items-center justify-center">
                        <select value={sid} onChange={w => setSid(parseInt(w.target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2">
                            {streams.map((w, ind) => (
                                <option key={ind} value={ind}>Stream server: {w.name}</option>
                            ))}
                        </select>
                    </div>
                    {fileType === 'video' ? <div>
                        <video title={`${file?.name}`} crossOrigin="" className="w-full outline-none max-h-[800px]" controls controlsList="nodownload" src={`${streams[sid].link}/stream/${cid}/${fid}`}></video>
                    </div> : ""}
                    {fileType === 'audio' ? <div>
                        <audio crossOrigin="" className="w-full outline-none" controls controlsList="nodownload" src={`${streams[sid].link}/stream/${cid}/${fid}`}></audio>
                    </div> : ""}
                </> : ""}
            {(fileType === 'image' && href !== "") ? <div className="grid justify-center">
                <p className="text-center text-2xl pb-4">Preview</p>
                <img src={href} />
            </div> : ""}
        </div>
    )
}