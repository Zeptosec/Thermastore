import { DownloadStatus, getEarliestEnd, getImage, getImageHref, getImagePreviewHref } from "@/utils/FileDownload"
import { getFileType, DirFile, FileType, chunkSize } from "@/utils/FileFunctions";
import { useEffect, useState } from "react";
import CoolLoader from "./CoolLoading2";
import useFileManager from "@/context/FileManagerContext";
import AudioPlayer from "./Audio/AudioPlayer";

interface Props {
    file?: DownloadStatus,
    dirFile?: DirFile,
    fid: string,
    cid: string
}

export default function PreviewFile({ file, fid, cid, dirFile }: Props) {
    const [sid, setSid] = useState(0);
    const [href, setHref] = useState<{ url?: string, loadState: 'loading' | 'loaded' | 'failed' | 'nopreview' }>({ loadState: 'loading' });
    const [videoPoster, setVideoPoster] = useState<string | undefined>();
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
        async function showImage(limit = 300 * 1024) {
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
        async function getPoster() {
            if (dirFile && dirFile.preview) {
                const firstEnd = await getEarliestEnd(streamers);
                setVideoPoster(`${firstEnd.link}/down/${dirFile.chanid}/${dirFile.preview}`);
            }
        }

        switch (fileType) {
            case 'pdf':
                // dont know the file chunk size
                showImage(chunkSize);
                break;
            case 'image':
                showImage();
                break;
            case 'video':
                getPoster();
                break;
        }
        if (['video', 'audio'].includes(fileType)) {
            getFastestRespond();
        }
        return () => {
            if (href.url) {
                URL.revokeObjectURL(href.url);
            }
        }
    }, [])

    const [repeat, setRepeat] = useState(false);
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
                        <video crossOrigin="" className="w-full outline-none max-h-[800px]" poster={videoPoster ? videoPoster : ''} controls controlsList="nodownload" src={`${streamers[sid].link}/stream/${cid}/${fid}`}></video>
                    </div> : ""}
                    {fileType === 'audio' ? <div>
                        <AudioPlayer
                            src={`${streamers[sid].link}/stream/${cid}/${fid}`}
                            repeat={repeat}
                            onRepeat={() => setRepeat(w => !w)} />
                        {/* <audio crossOrigin="" className="w-full outline-none" controls controlsList="nodownload" src={`${streamers[sid].link}/stream/${cid}/${fid}`}></audio> */}
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
            {fileType === 'pdf' && <div>
                {href.loadState === 'loading' ? <div>
                    <p className="text-center text-2xl pb-4">Getting pdf url</p>
                    <div className="relative min-h-[100px]">
                        <CoolLoader />
                    </div>
                </div> : href.loadState === 'failed' ? <div>
                    <p className="text-center text-2xl pb-4 text-tertiary">Failed to load preview</p>
                </div> : href.loadState === 'nopreview' ? <div>
                    <p className="text-center text-2xl pb-4 text-tertiary">PDF has no preview or is too big MAX 25MB</p>
                </div> : <div>
                    <p className="text-center text-2xl pb-4">Preview</p>
                    <iframe width="100%" className="h-[min(600px,_calc(100vh-25px))] min-h-[200px]" src={`/pdf/web/viewer.html?q=${href.url}`}></iframe>
                </div>}
                {/* <embed src={`${streamers[sid].link}/stream/${cid}/${fid}`} width="100%" className="h-[min(600px,_calc(100vh-25px))] min-h-[200px]" type="application/pdf" /> */}
            </div>}
        </div>
    )
}