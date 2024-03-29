import { Directory, DirFile, equalDir } from "@/utils/FileFunctions"
import { useEffect, useRef, useState } from "react"
import { FileStatus } from "@/utils/FileUploader"
import useFiles, { SettingActionType } from "@/context/FilesContext"
import DisplayFile from "./DisplayFile"
import UploadCard from "../UploadCard"
import DisplayDirectory from "./DisplayDirectory"

interface Props {
    selectable?: boolean,
    fs?: FileStatus[],
    dropped?: (directory: Directory, event: any) => void,
    updateUploading?: () => void
}

export default function DisplayFiles({ selectable, fs, dropped, updateUploading }: Props) {
    const audioRef = useRef<any>();
    const fileSystem = useFiles();
    async function SelectMultiple(endSelAt: DirFile | Directory, isSelected: boolean) {
        const hasSel = document.getSelection();
        if (hasSel) {
            hasSel.removeAllRanges();
        }
        if (fileSystem.state.selected.length > 0) {
            const filteredCurrentlyUploading = fs?.map(w => w.fileItem).filter(w => w !== undefined);
            let filesToSelectFrom: (Directory | DirFile)[];
            if (filteredCurrentlyUploading && filteredCurrentlyUploading.length > 0) {
                //@ts-ignore
                filesToSelectFrom = [...filteredCurrentlyUploading, ...files];
            } else {
                filesToSelectFrom = fileSystem.state.files;
            }
            const lastSelected = fileSystem.state.selected[fileSystem.state.selected.length - 1];
            let startInd = filesToSelectFrom.indexOf(lastSelected);
            let endInd = filesToSelectFrom.indexOf(endSelAt);
            if (startInd === -1 || endInd === -1) return;
            const mark = fileSystem.state.selected.indexOf(endSelAt) === -1;
            if (startInd > endInd) {
                const tmp = startInd;
                startInd = endInd;
                endInd = tmp;
            }
            const w = fileSystem.state.selected;
            let newSel: (Directory | DirFile)[];
            if (mark) {
                let tobemarked: (DirFile | Directory)[] = [];
                for (let i = startInd; i <= endInd; i++) {
                    if (!w.includes(filesToSelectFrom[i]))
                        tobemarked.push(filesToSelectFrom[i]);
                }
                newSel = [...w, ...tobemarked];
            } else {
                let leftMarked = [...w];
                for (let i = startInd; i <= endInd; i++) {
                    let ind = leftMarked.indexOf(filesToSelectFrom[i]);
                    if (ind !== -1) {
                        leftMarked.splice(ind, 1);
                    }
                }
                newSel = leftMarked;
            }
            fileSystem.dispatch({
                type: SettingActionType.SET_SELECTED,
                selected: newSel
            })
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

    return (
        <div className="grid gap-1 overflow-hidden">
            {fs?.map((w, ind) => w.fileItem ? <DisplayFile key={`upfil${ind}`} file={w.fileItem} SelectMultiple={SelectMultiple} selectable={selectable} /> : <UploadCard key={`upc${ind}`} file={w} />)}
            {(fileSystem.state.files && fileSystem.state.dirs && fileSystem.state.files.length + fileSystem.state.dirs.length > 0) || (fs && fs.length > 0) ? <>
                {fileSystem.state.dirs.map((w, ind) => (
                    <DisplayDirectory
                        key={`${ind}dir${w.id}`}
                        dir={w}
                        SelectMultiple={SelectMultiple}
                        selectable={selectable}
                        dropped={dropped}
                        updateUploading={updateUploading}
                    />
                ))}
                {fileSystem.state.files.map((w, ind) => (
                    <DisplayFile
                        key={`${ind}fil${w.id}`}
                        file={w}
                        SelectMultiple={SelectMultiple}
                        selectable={selectable}
                    />
                ))}
            </> : <div>
                <p className="text-2xl text-center py-5">No files here...</p>
            </div>}
        </div>
    )
}