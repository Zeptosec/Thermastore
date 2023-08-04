import { DownloadStatus, getEarliestEnd, getImage, getImageHref, getImagePreviewHref } from "@/utils/FileDownload"
import { getFileType, DirFile, FileType } from "@/utils/FileFunctions";
import { useEffect, useState } from "react";
import CoolLoader from "./CoolLoading2";
import useFileManager from "@/context/FileManagerContext";

interface Props {
    file?: DownloadStatus,
    dirFile?: DirFile,
    fid: string,
    cid: string
}

export default function PreviewFile({ file, fid, cid, dirFile }: Props) {
    const [sid, setSid] = useState(0);
    const [href, setHref] = useState<{ url?: string, loadState: 'loading' | 'loaded' | 'failed' | 'nopreview' }>({ loadState: 'loading' });
    const fileType: FileType = file ? getFileType(file.name) : dirFile ? getFileType(dirFile.name) : 'file';
    const { streamers } = useFileManager();
    useEffect(() => {
        async function getFastestRespond() {
            const fastestEnd = await getEarliestEnd(streamers)
            const ind = streamers.indexOf(fastestEnd);
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
                        const hr = await getImage(dirFile.chanid, dirFile.fileid, streamers);
                        setHref({ url: hr, loadState: 'loaded' });
                        prevLoaded = true;
                    } catch (err) {
                        console.error(err);
                        setHref(w => ({ ...w, loadState: 'failed' }));
                    }
                } else if (dirFile.preview) {
                    try {
                        const hr = await getImagePreviewHref(dirFile, streamers);
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
                    const hr = await getImageHref(file, cid, streamers);
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
                        <select value={sid} onChange={w => setSid(parseInt(w.target.value))} className="bg-secondary border border-primary text-quaternary text-sm rounded-lg focus:ring-tertiary focus:border-tertiary block w-full p-2 outline-none">
                            {streamers.map((w, ind) => (
                                <option key={ind} value={ind}>Stream server: {w.name}</option>
                            ))}
                        </select>
                    </div>
                    {fileType === 'video' ? <div>
                        <video crossOrigin="" className="w-full outline-none max-h-[800px]" controls controlsList="nodownload" src={`${streamers[sid].link}/stream/${cid}/${fid}`}></video>
                    </div> : ""}
                    {fileType === 'audio' ? <div>
                        <audio crossOrigin="" className="w-full outline-none" controls controlsList="nodownload" src={`${streamers[sid].link}/stream/${cid}/${fid}`}></audio>
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