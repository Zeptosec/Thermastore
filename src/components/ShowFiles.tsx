import { Directory, DirFile } from "@/utils/FileFunctions"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import DirItem from "./Dirtem"
import FileItem from "./FileItem"

interface Props {
    files: (Directory | DirFile)[],
    setDirHistory: Dispatch<SetStateAction<number[]>>,
    selected?: (DirFile | Directory)[],
    setSelected?: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected?: Function,
    selectable?: boolean
}

export interface PlayStatus {
    playFile: DirFile,
    paused: boolean,
    start: boolean,
    percent: number
}

export default function ShowFilesPage({ files, setDirHistory, selected, setSelected, MoveSelected, selectable }: Props) {
    const [currPlayingFile, setCurrPlayingFile] = useState<PlayStatus>();
    const audioRef = useRef<any>();
    function playAudio(file: DirFile | undefined) {
        if (!file) {
            if (audioRef.current && !audioRef.current.paused)
                audioRef.current.pause();
            setCurrPlayingFile(undefined);
        } else {
            if (currPlayingFile && file.created_at === currPlayingFile.playFile.created_at) {
                if (!audioRef.current) return;
                if (audioRef.current.paused) {
                    audioRef.current.play();
                    setCurrPlayingFile(w => w ? { ...w, paused: false, start: false } : w);
                } else {
                    audioRef.current.pause();
                    setCurrPlayingFile(w => w ? { ...w, paused: true, start: false } : w);
                }
            } else {
                setCurrPlayingFile({ playFile: file, paused: false, start: true, percent: 0 });
            }
        }
    }

    useEffect(() => {
        const keyDownHandler = (e: KeyboardEvent) => {
            if (!audioRef.current) return;
            switch (e.code) {
                case 'ArrowLeft':
                    audioRef.current.currentTime -= 5;
                    break;
                case 'ArrowRight':
                    audioRef.current.currentTime += 5;
                    break;
            }
        };
        document.addEventListener("keydown", keyDownHandler);

        return () => {
            document.removeEventListener("keydown", keyDownHandler);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current && audioRef.current.paused && currPlayingFile && currPlayingFile.start) audioRef.current.play();
    }, [currPlayingFile]);

    return (
        <div className="grid gap-1 overflow-hidden">
            {currPlayingFile ? <audio onTimeUpdate={() => setCurrPlayingFile(w => w ? {...w, percent: audioRef.current.currentTime / audioRef.current.duration * 100} : w)} preload="none" onEnded={() => playAudio(undefined)} ref={audioRef} src={`https://streamer.teisingas.repl.co/stream/${currPlayingFile.playFile.chanid}/${currPlayingFile.playFile.fileid}`} /> : ""}
            {files.map((w, ind) => (
                'fileid' in w ?
                    <FileItem key={ind} file={w} setSelected={setSelected} selected={selected} playing={currPlayingFile} togglePlay={playAudio} selectable={selectable} />
                    :
                    <DirItem key={ind} dir={w} setDirHistory={setDirHistory} selected={selected} setSelected={setSelected} MoveSelected={MoveSelected} selectable={selectable} />
            ))}
        </div>
    )
}