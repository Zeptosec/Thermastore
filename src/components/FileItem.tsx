import { BytesToReadable, Directory, DirFile, getFileIconName } from "@/utils/FileFunctions"
import Link from "next/link"
import { Dispatch, SetStateAction, useRef, useState } from "react"

interface Props {
    file: DirFile,
    selected: (DirFile | Directory)[],
    setSelected: Dispatch<SetStateAction<(DirFile | Directory)[]>>
}
export default function FileItem({ file, selected, setSelected }: Props) {
    const lref = useRef<any>(null);
    const refCopy = useRef<any>(null);
    function copyClipboard() {
        navigator.clipboard.writeText(lref.current.href);
    }

    function clicked(w: any) {
        if (!(lref.current && lref.current.contains(w.target) ||
            refCopy.current && refCopy.current.contains(w.target))) {
            const rez = selected.findIndex(el => el.created_at === file.created_at);
            if (rez === -1) setSelected(el => [...el, file]);
            else setSelected(el => [...el.slice(0, rez), ...el.slice(rez + 1)]);
        }
    }
    return (
        <div onClick={w => clicked(w)} className="flex justify-between card group gap-1">
            <div className={`flex transition-all duration-200 items-center ${selected.length > 0 ? `gap-2` : ``}`}>
                <div className={`border-blue-900 rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 ${selected.length > 0 ? `w-3.5 h-3.5 border` : `w-0 h-0`}`}>
                    <div className={`rounded-full w-2 h-2 bg-blue-700 transition-opacity duration-200 ${selected.findIndex(w => w.created_at === file.created_at) !== -1 ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}></div>
                </div>
                <div className="flex gap-2 items-center justify-center">
                    <div className="w-5 h-4 m-auto sm:block hidden">
                        <i className={`gg-${getFileIconName(file.name)} m-auto text-blue-900 group-hover:text-blue-700 transition-colors duration-200`}></i>
                    </div>
                    <Link target="_blank" ref={lref} href={`/download/${file.data}`}>{file.name}</Link>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                <p>{BytesToReadable(file.size)}</p>
                <abbr
                    ref={refCopy}
                    title="Copy link"
                    onClick={() => copyClipboard()}
                    className="w-6 h-6 cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200">
                    <i className="gg-link mt-3 ml-2 "></i>
                </abbr>
            </div>
        </div>
    )
}