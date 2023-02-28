import { Directory, DirFile } from "@/utils/FileFunctions"
import { supabase } from "@/utils/Supabase";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import SelectionBubble from "./SelectionBubble";

interface Props {
    dir: Directory,
    setDirHistory: Dispatch<SetStateAction<number[]>>,
    selected: (DirFile | Directory)[],
    setSelected: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected: Function
}
export default function DirItem({ dir, setDirHistory, selected, setSelected, MoveSelected }: Props) {
    const refName = useRef<any>(null);
    const refOptions = useRef<any>(null);
    const [isNaming, setIsNaming] = useState(false);
    const [name, setName] = useState<string>(dir.name);

    function clicked(w: any) {
        if (refName.current && !refName.current.contains(w.target) && refOptions.current && !refOptions.current.contains(w.target)) {
            const rez = selected.findIndex(el => el.created_at === dir.created_at);
            if (rez === -1) setSelected(el => [...el, dir]);
            else setSelected(el => [...el.slice(0, rez), ...el.slice(rez + 1)]);
        }
    }

    async function saveName() {
        setIsNaming(false);
        if (name.length < 3) {
            setName(dir.name);
            alert("Directory name is too short");
        } else if (name.length > 24) {
            setName(dir.name);
            alert("Directory name is too long");
        } else {
            const { error } = await supabase
                .from("directories")
                .update({ name })
                .eq("id", dir.id);
            if (error) {
                console.log(error);
                alert(error.message);
            }
        }
    }

    function openDir() {
        const rez = selected.findIndex(el => el.created_at === dir.created_at);
        if (rez !== -1)
            setSelected(w => [...w.slice(0, rez), ...w.slice(rez + 1)])
        setDirHistory(prev => [...prev, dir.id])
    }

    return (
        <div onClick={w => clicked(w)} className="flex justify-between card group">
            <SelectionBubble file={dir} selected={selected}>
                <div className="flex gap-2 items-center justify-center">
                    <div className="w-5 h-4 m-auto sm:block hidden">
                        <i className="gg-folder m-auto text-blue-900 group-hover:text-blue-700 transition-colors duration-200"></i>
                    </div>
                    {isNaming ?
                        <form onSubmit={w => { w.preventDefault(); saveName(); }}>
                            <input type="text" autoFocus value={name} onChange={w => setName(w.target.value)} onBlur={saveName} />
                        </form> :
                        <p ref={refName} onClick={w => openDir()} className="cursor-pointer">{name}</p>}
                </div>
            </SelectionBubble>
            <div ref={refOptions} className={`flex items-center gap-2`}>
                {selected.length > 0 ? <abbr title="Move to this directory"><i onClick={() => MoveSelected(dir.id, false)} className={`gg-add-r cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200`}></i></abbr> : ""}
                {!isNaming ? <abbr onClick={() => setIsNaming(w => !w)} title="Rename"><i className="gg-rename cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200"></i></abbr> : ""}
            </div>
        </div>
    )
}