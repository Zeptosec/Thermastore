import { DownloadStatus, getEarliestEnd, getImage, getImageHref, getImagePreviewHref } from "@/utils/FileDownload"
import { getFileType, DirFile, FileType } from "@/utils/FileFunctions";
import { Endpoint } from "@/utils/FileUploader";
import { useEffect, useState } from "react";
import { endPoints } from "@/utils/FileFunctions";
import CoolLoader from "./CoolLoading2";

interface Props {
    file?: DownloadStatus,
    dirFile?: DirFile,
    fid: string,
    cid: string
}

const streams: Endpoint[] = endPoints;

export default function PreviewFile({ file, fid, cid, dirFile }: Props) {
    const [sid, setSid] = useState(0);
    const [href, setHref] = useState<{ url?: string, loadState: 'loading' | 'loaded' | 'failed' | 'nopreview' }>({ loadState: 'loading' });
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
            const limit = 300 * 1024;
            let prevLoaded = false;
            if (dirFile) {
                if (dirFile.size <= limit) {
                    try {
                        const hr = await getImage(dirFile.chanid, dirFile.fileid);
                        setHref({ url: hr, loadState: 'loaded' });
                        prevLoaded = true;
                    } catch (err) {
                        console.error(err);
                        setHref(w => ({ ...w, loadState: 'failed' }));
                    }
                } else if (dirFile.previews) {
                    try {
                        const hr = await getImagePreviewHref(dirFile);
                        setHref({ url: hr, loadState: 'loaded' });
                        prevLoaded = true;
                    } catch (err) {
                        console.error(err);
                        setHref(w => ({ ...w, loadState: 'failed' }));
                    }
                }
            }
            if (!prevLoaded && file && file.size <= limit) {
                try {
                    const hr = await getImageHref(file, cid);
                    setHref({
                        url: hr,
                        loadState: 'loaded'
                    });
                    prevLoaded = true;
                } catch (err) {
                    console.error(err);
                    setHref(w => ({ ...w, loadState: 'failed' }));
                    alert("File not found!");
                }
            }
            if (!prevLoaded) {
                setHref(w => ({ ...w, loadState: 'nopreview' }))
            }
        }
        if (fileType === 'image')
            showImage();
        if (['video', 'audio'].includes(fileType)) {
            getFastestRespond();
        }
        return () => {
            if (href.url) {
                URL.revokeObjectURL(href.url);
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
                        <video crossOrigin="" className="w-full outline-none max-h-[800px]" controls controlsList="nodownload" src={`${streams[sid].link}/stream/${cid}/${fid}`}></video>
                    </div> : ""}
                    {fileType === 'audio' ? <div>
                        <audio crossOrigin="" className="w-full outline-none" controls controlsList="nodownload" src={`${streams[sid].link}/stream/${cid}/${fid}`}></audio>
                    </div> : ""}
                </> : ""}
            {(fileType === 'image') ? <div className="grid justify-center">
                {href.loadState === 'loading' ? <div>
                    <p className="text-center text-2xl pb-4">Loading image preview</p>
                    <div className="relative min-h-[100px]">
                        <CoolLoader />
                    </div>
                </div> : href.loadState === 'failed' ? <div>
                    <p className="text-center text-2xl pb-4 text-tertiary">Failed to load preview</p>
                </div> : href.loadState === 'nopreview' ? <div>
                    <p className="text-center text-2xl pb-4 text-tertiary">File has no preview</p>
                </div> : <div>
                    <p className="text-center text-2xl pb-4">Preview</p>
                    <img src={href.url} />
                </div>}
            </div> : ""}
        </div>
    )
}