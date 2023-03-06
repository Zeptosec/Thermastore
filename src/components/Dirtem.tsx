import { Directory, DirFile } from "@/utils/FileFunctions"
import { supabase } from "@/utils/Supabase";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import SelectionBubble from "./SelectionBubble";

interface Props {
    dir: Directory,
    setDirHistory: Dispatch<SetStateAction<number[]>>,
    selected?: (DirFile | Directory)[],
    setSelected?: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected?: Function,
    SelectMultiple?: Function,
    selectable?: boolean
}
export default function DirItem({ dir, setDirHistory, selected, setSelected, MoveSelected, selectable, SelectMultiple }: Props) {
    const refName = useRef<any>(null);
    const refOptions = useRef<any>(null);
    const [isNaming, setIsNaming] = useState(false);
    const [name, setName] = useState<string>(dir.name);
    const [shared, setShared] = useState(dir.shared);
    function clicked(w: any) {
        if (!selectable || !selected || !setSelected) return;
        if (refName.current && !refName.current.contains(w.target) && refOptions.current && !refOptions.current.contains(w.target)) {
            const rez = selected.findIndex(el => el.created_at === dir.created_at);
            if (SelectMultiple && w.shiftKey) {
                SelectMultiple(dir, rez !== -1);
            } else if (rez === -1) {
                setSelected(el => [...el, dir]);
            } else {
                setSelected(el => [...el.slice(0, rez), ...el.slice(rez + 1)]);
            }
        }
    }
    useEffect(() => {
        setName(dir.name);
        setShared(dir.shared);
        setIsNaming(false);
    }, [dir])

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
        if (selected && setSelected) {
            const rez = selected.findIndex(el => el.created_at === dir.created_at);
            if (rez !== -1)
                setSelected(w => [...w.slice(0, rez), ...w.slice(rez + 1)])
        }
        setDirHistory(prev => [...prev, dir.id])
    }

    async function shareManager() {
        if (shared) {
            if (!confirm("Disabling sharing for this directory will remove access from listing files within it. But users which obtained links to files within this directory will still be able to access them! Do you want to remove access to this directory?")) {
                return;
            }
        } else {
            if (!confirm("Sharing this directory will share all the files inside it but not the within other directories unless they are shared too. Other users will be able to get file links and ACCESS FILES even after sharing is stopped! Do you want to share this directory?")) {
                return;
            }
        }
        const { error } = await supabase
            .from("directories")
            .update({ shared: !shared })
            .eq('id', dir.id);
        if (error)
            alert(error.message);
        else {
            setShared(!shared);
            dir.shared = !shared;
        }
    }

    function copyClipboard() {
        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/shared/${new Date(dir.created_at).getTime()}/${dir.id}`);
    }

    <abbr
        title="Copy link"
        onClick={() => copyClipboard()}
        className="w-6 h-6 cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200">
        <i className="gg-link mt-3 ml-2 "></i>
    </abbr>
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
                {selected && MoveSelected && selected.length > 0 ? <abbr title="Move to this directory"><i onClick={() => MoveSelected(dir.id, false)} className={`gg-add-r cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200`}></i></abbr> : ""}
                {selectable ? <div onClick={() => shareManager()} className="w-5 h-6">{shared ?
                    <abbr className="cursor-pointer" title="Stop sharing"><i className="gg-lock-unlock m-auto text-blue-900 hover:text-blue-700 transition-colors duration-200"></i></abbr>
                    : <abbr className="cursor-pointer" title="Start sharing"><i className="gg-lock m-auto text-blue-900 hover:text-blue-700 transition-colors duration-200"></i></abbr>}</div> : ""}
                {shared ? <abbr
                    title="Copy link"
                    onClick={() => copyClipboard()}
                    className="w-6 h-6 cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200">
                    <i className="gg-link mt-3 ml-2 "></i>
                </abbr> : ""}
                {!isNaming && selectable ? <abbr onClick={() => setIsNaming(w => !w)} title="Rename"><i className="gg-rename cursor-pointer text-blue-900 hover:text-blue-700 transition-colors duration-200"></i></abbr> : ""}
            </div>
        </div>
    )
}