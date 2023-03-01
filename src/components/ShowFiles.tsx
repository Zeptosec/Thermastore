import { Directory, DirFile } from "@/utils/FileFunctions"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import DirItem from "./Dirtem"
import FileItem from "./FileItem"

interface Props {
    files: (Directory | DirFile)[],
    setDirHistory: Dispatch<SetStateAction<number[]>>,
    selected: (DirFile | Directory)[],
    setSelected: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected: Function
}

export default function ShowFilesPage({ files, setDirHistory, selected, setSelected, MoveSelected }: Props) {
    const [currPlayingFile, setCurrPlayingFile] = useState<DirFile>();
    const audioRef = useRef<any>();

    function playAudio(file: DirFile | undefined) {
        if (!file) {
            if (audioRef.current && !audioRef.current.paused)
                audioRef.current.pause();
            setCurrPlayingFile(undefined);
        } else {
            if (file.created_at === currPlayingFile?.created_at) {
                if (!audioRef.current) return;
                if (audioRef.current.paused)
                    audioRef.current.play();
                else
                    audioRef.current.pause();
            } else {
                setCurrPlayingFile(file);
            }
        }
    }

    useEffect(() => {
        if (audioRef.current && audioRef.current.paused && currPlayingFile) audioRef.current.play();
    }, [currPlayingFile])

    return (
        <div className="grid gap-1 overflow-hidden">
            {currPlayingFile ? <audio preload="none" onEnded={() => playAudio(undefined)} ref={audioRef} src={`https://streamer.teisingas.repl.co/stream/${currPlayingFile.chanid}/${currPlayingFile.fileid}`} /> : ""}
            {files.map((w, ind) => (
                'fileid' in w ?
                    <FileItem key={ind} file={w} setSelected={setSelected} selected={selected} playing={currPlayingFile} togglePlay={playAudio} />
                    : <DirItem key={ind} dir={w} setDirHistory={setDirHistory} selected={selected} setSelected={setSelected} MoveSelected={MoveSelected} />
            ))}
        </div>
    )
}