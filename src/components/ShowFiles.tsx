import { Directory, DirFile } from "@/utils/FileFunctions"
import { Dispatch, SetStateAction, useState } from "react"
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
    return (
        <div className="grid gap-1">
            {files.map((w, ind) => (
                'data' in w ?
                    <FileItem key={ind} file={w} setSelected={setSelected} selected={selected} />
                    : <DirItem key={ind} dir={w} setDirHistory={setDirHistory} selected={selected} setSelected={setSelected} MoveSelected={MoveSelected} />
            ))}
        </div>
    )
}