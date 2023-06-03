import { Directory, DirFile, getReadableDate, indexOfSelected } from "@/utils/FileFunctions"
import { supabase } from "@/utils/Supabase";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import SelectionBubble from "./SelectionBubble";
import AnimatedDropZone from "./AnimatedDropZone";

interface Props {
    dir: Directory,
    setDirHistory: Dispatch<SetStateAction<Directory[]>>,
    selected?: (DirFile | Directory)[],
    setSelected?: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected?: Function,
    SelectMultiple?: Function,
    selectable?: boolean,
    dropped?: (_files: FileList | null, directory: Directory) => void
}
export default function DirItem({ dir, setDirHistory, selected, setSelected, MoveSelected, selectable, SelectMultiple, dropped }: Props) {
    const refName = useRef<any>(null);
    const refExpand = useRef<any>(null);
    const refOptions = useRef<any>(null);
    const [isNaming, setIsNaming] = useState(false);
    const [name, setName] = useState<string>(dir.name);
    const [shared, setShared] = useState(dir.shared);
    const [informCopy, setInformCopy] = useState("Copy link");
    const [open, setOpen] = useState(false);
    const [dragging, setDragging] = useState(false);

    function clicked(w: any) {
        if (!selectable || !selected || !setSelected) return;
        if (refName.current && !refName.current.contains(w.target)
            && refExpand.current && !refExpand.current.contains(w.target)
            && refOptions.current && !refOptions.current.contains(w.target)) {
            const rez = indexOfSelected(selected, dir);
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
            const rez = indexOfSelected(selected, dir);
            if (rez !== -1)
                setSelected(w => [...w.slice(0, rez), ...w.slice(rez + 1)])
        }
        setDirHistory(prev => [...prev, dir])
    }

    async function shareManager() {
        if (shared) {
            if (!confirm("Disabling sharing for this directory will remove access from listing files within it. But users which obtained links to files within this directory will still be able to access them! Do you want to remove access to this directory?")) {
                return;
            }
        } else {
            if (!confirm("sharing this directory will allow others to access the files in this directory but not the files in sub-directories unless they are shared as well. Do you want to share this directory?")) {
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

    const [tmout, setTmout] = useState<NodeJS.Timeout | null>(null);
    function copyClipboard() {
        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/shared/${new Date(dir.created_at).getTime()}/${dir.id}`);
        setInformCopy("Link Copied!");
        if (tmout) {
            clearTimeout(tmout);
        }
        setTmout(setTimeout(() => setInformCopy("Copy link"), 2000))
    }
    

    return (
        <AnimatedDropZone
            dragging={dragging}
            setDragging={setDragging}
            dropped={selectable && dropped ? (_files) => dropped(_files, dir) : undefined}
            textClassName="text-file text-2xl"
        >
            <div onClick={w => clicked(w)} className="card group">
                <div className="flex justify-between overflow-hidden">
                    <SelectionBubble file={dir} selected={selected}>
                        <div className="flex gap-2 items-center justify-center">
                            <div className="w-5 h-4 m-auto block">
                                <i className="gg-folder m-auto text-file group-hover:text-filehover transition-colors duration-200"></i>
                            </div>
                            {isNaming ?
                                <form onSubmit={w => { w.preventDefault(); saveName(); }}>
                                    <input type="text" autoFocus value={name} onChange={w => setName(w.target.value)} onBlur={saveName} />
                                </form> :
                                <p ref={refName} onClick={w => openDir()} className="cursor-pointer hover:text-filehover transition-colors">{name}</p>}
                        </div>
                    </SelectionBubble>
                    <div ref={refExpand} className={`flex items-center gap-2`}>
                        {selected && MoveSelected && selected.length > 0 ? <abbr title="Move to this directory"><i onClick={() => MoveSelected(dir.id, false)} className={`gg-add-r cursor-pointer text-file hover:text-filehover transition-colors duration-200`}></i></abbr> : ""}
                        <div onClick={() => setOpen(w => !w)} className="relative w-[22px] h-[22px]">
                            <i className={`gg-chevron-down z-10 text-file w-[22px] h-[22px] cursor-pointer hover:text-filehover transition-all ${open ? 'rotate-180' : ''}`}></i>
                        </div>
                    </div>
                </div>
                <div className={`transition-all ease-in-out duration-300 flex justify-between gap-1 select-none overflow-hidden ${open ? ' max-h-20  mt-1' : 'max-h-0'}`}>
                    <div className="grid gap-1">
                        <p>Created {getReadableDate(dir.created_at)}</p>
                    </div>
                    <div ref={refOptions} className="grid gap-1">
                        {selectable ? <div onClick={() => shareManager()} className=" cursor-pointer text-file hover:text-filehover transition-colors duration-200">
                            {shared ? <div className="flex gap-3 items-center mr-0.5">
                                <p className="whitespace-nowrap">Stop sharing</p>
                                <abbr title="Stop sharing" className="w-6 h-6"><i className="gg-lock-unlock m-auto ml-2"></i></abbr>
                            </div> : <div className="flex gap-3 items-center mr-0.5">
                                <p className="whitespace-nowrap">Start sharing</p>
                                <abbr className="w-6 h-6" title="Start sharing"><i className="gg-lock m-auto ml-2"></i></abbr>
                            </div>}
                        </div> : ""}
                        {shared ? <div onClick={() => copyClipboard()} className="whitespace-nowrap flex gap-2 justify-end cursor-pointer text-file hover:text-filehover transition-colors duration-200">
                            <p>{informCopy}</p>
                            <abbr
                                title="Copy link"
                                className="w-6 h-6 ">
                                <i className="gg-link mt-3 ml-2 "></i>
                            </abbr>
                        </div> : ''}
                        {!isNaming && selectable ? <div onClick={() => setIsNaming(w => !w)} className="whitespace-nowrap flex justify-end gap-2 items-center cursor-pointer text-file hover:text-filehover transition-colors duration-200">
                            <p>Rename</p>
                            <abbr className="w-6 h-6" title="Rename"><i className="gg-rename m-auto mt-1"></i></abbr>
                        </div> : ''}
                    </div>
                </div>
            </div>
        </AnimatedDropZone>
    )
}