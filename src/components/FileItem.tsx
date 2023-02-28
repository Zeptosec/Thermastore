import { BytesToReadable, Directory, DirFile, getFileIconName } from "@/utils/FileFunctions"
import { supabase } from "@/utils/Supabase";
import Link from "next/link"
import { Dispatch, SetStateAction, useRef, useState } from "react"
import SelectionBubble from "./SelectionBubble";
import StrechableText from "./StrechableText";

interface Props {
    file: DirFile,
    selected: (DirFile | Directory)[],
    setSelected: Dispatch<SetStateAction<(DirFile | Directory)[]>>
}
export default function FileItem({ file, selected, setSelected }: Props) {
    const lref = useRef<any>(null);
    const refCopy = useRef<any>(null);
    const [isNaming, setIsNaming] = useState(false);
    const [name, setName] = useState<string>(file.name);
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

    async function saveName() {
        setIsNaming(false);
        if (name.length < 3) {
            setName(file.name);
            alert("File name is too short");
        } else if (name.length > 42) {
            setName(file.name);
            alert("File name is too long");
        } else {
            const { error } = await supabase
                .from("files")
                .update({ name })
                .eq("id", file.id);
            if (error) {
                console.log(error);
                alert(error.message);
            }
        }
    }

    return (
        <div onClick={w => clicked(w)} className="flex justify-between card group gap-1 overflow-hidden">
            <SelectionBubble file={file} selected={selected}>
                <div className="flex gap-2 items-center overflow-hidden">
                    <div className="w-5 h-4 m-auto sm:block hidden">
                        <i className={`gg-${getFileIconName(file.name)} m-auto text-blue-900 group-hover:text-blue-700 transition-colors duration-200`}></i>
                        {/* Maybe add file feature like play button for audio */}
                    </div>
                    {isNaming ?
                        <form ref={lref} onSubmit={w => { w.preventDefault(); saveName(); }}>
                            <input type="text" autoFocus value={name} onChange={w => setName(w.target.value)} onBlur={saveName} />
                        </form> :
                        <Link className="flex overflow-hidden" target="_blank" ref={lref} href={`/download/${file.chanid}/${file.fileid}`}>
                            <StrechableText text={name} />
                        </Link>}
                </div>
            </SelectionBubble>
            <div className="flex gap-2 items-center">
                <p className="whitespace-nowrap">{BytesToReadable(file.size)}</p>
                <div ref={refCopy} className="flex gap-2 items-center">
                    <abbr
                        title="Copy link"
                        onClick={() => copyClipboard()}
                        className="w-6 h-6 cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200">
                        <i className="gg-link mt-3 ml-2 "></i>
                    </abbr>
                    {!isNaming ? <abbr className="sm:block hidden" onClick={() => setIsNaming(w => !w)} title="Rename"><i className="gg-rename cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200"></i></abbr> : ""}
                </div>
            </div>
        </div>
    )
}