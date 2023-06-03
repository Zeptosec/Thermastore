import { Directory, DirFile, equalDir } from "@/utils/FileFunctions"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import DirItem from "./Dirtem"
import FileItem from "./FileItem"
import { FileStatus } from "@/utils/FileUploader"
import UploadCard from "./UploadCard"

interface Props {
    files: (Directory | DirFile)[],
    setDirHistory: Dispatch<SetStateAction<Directory[]>>,
    selected?: (DirFile | Directory)[],
    setSelected?: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected?: Function,
    selectable?: boolean,
    fs?: FileStatus[],
    dropped?: (_files: FileList | null, directory: Directory) => void
}

export interface PlayStatus {
    playFile: DirFile,
    paused: boolean,
    start: boolean,
    percent: number
}

export default function ShowFilesPage({ files, setDirHistory, selected, setSelected, MoveSelected, selectable, fs, dropped }: Props) {
    const [currPlayingFile, setCurrPlayingFile] = useState<PlayStatus>();
    const audioRef = useRef<any>();

    async function SelectMultiple(endSelAt: DirFile | Directory, isSelected: boolean) {
        const hasSel = document.getSelection();
        if (hasSel) {
            hasSel.removeAllRanges();
        }
        if (selected && setSelected && selected.length > 0) {
            const lastSelected = selected[selected.length - 1];
            let startInd = files.indexOf(lastSelected);
            let endInd = files.indexOf(endSelAt);
            if (startInd === -1 || endInd === -1) return;
            const mark = selected.indexOf(endSelAt) === -1;
            if (startInd > endInd) {
                const tmp = startInd;
                startInd = endInd;
                endInd = tmp;
            }
            if (mark) {
                setSelected(w => {
                    let tobemarked: (DirFile | Directory)[] = [];
                    for (let i = startInd; i <= endInd; i++) {
                        if (!w.includes(files[i]))
                            tobemarked.push(files[i]);
                    }
                    return [...w, ...tobemarked];
                })
            } else {
                setSelected(w => {
                    let leftMarked = [...w];
                    for (let i = startInd; i <= endInd; i++) {
                        let ind = leftMarked.indexOf(files[i]);
                        if (ind !== -1) {
                            leftMarked.splice(ind, 1);
                        }
                    }
                    return leftMarked;
                })
            }
        }
    }

    function playAudio(file: DirFile | undefined) {
        if (!file) {
            if (audioRef.current && !audioRef.current.paused)
                audioRef.current.pause();
            setCurrPlayingFile(undefined);
        } else {
            if (currPlayingFile && equalDir(file, currPlayingFile.playFile)) {
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
            {currPlayingFile ?
                <audio
                    onTimeUpdate={() => setCurrPlayingFile(w => w ? { ...w, percent: audioRef.current.currentTime / audioRef.current.duration * 100 } : w)}
                    preload="none"
                    onEnded={() => playAudio(undefined)}
                    ref={audioRef}
                    src={`https://next-streamer-nigerete123.koyeb.app/stream/${currPlayingFile.playFile.chanid}/${currPlayingFile.playFile.fileid}`} /> : ""}
            {fs?.map((w, ind) => w.fileItem ? <FileItem key={`upfil${ind}`} file={w.fileItem} SelectMultiple={SelectMultiple} setSelected={setSelected} selected={selected} playing={currPlayingFile} togglePlay={playAudio} selectable={selectable} /> : <UploadCard key={`upc${ind}`} file={w} />)}
            {files.map((w, ind) => (
                'fileid' in w ?
                    <FileItem 
                        key={`fil${ind}`} 
                        file={w} 
                        SelectMultiple={SelectMultiple} 
                        setSelected={setSelected} 
                        selected={selected} 
                        playing={currPlayingFile} 
                        togglePlay={playAudio} 
                        selectable={selectable} 
                    />
                    :
                    <DirItem 
                        key={`dir${ind}`} 
                        dir={w} 
                        SelectMultiple={SelectMultiple} 
                        setDirHistory={setDirHistory} 
                        selected={selected} 
                        setSelected={setSelected} 
                        MoveSelected={MoveSelected} 
                        selectable={selectable}
                        dropped={dropped}
                    />
            ))}
        </div>
    )
}