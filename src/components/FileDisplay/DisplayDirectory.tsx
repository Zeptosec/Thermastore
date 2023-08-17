import { Directory, getReadableDate, indexOfSelected } from "@/utils/FileFunctions"
import { useEffect, useRef, useState } from "react"
import SelectionBubble from "../SelectionBubble";
import AnimatedDropZone from "../AnimatedDropZone";
import StrechableText from "../StrechableText";
import useFiles, { SettingActionType } from "@/context/FilesContext";
import IconLink from "@/icons/IconLink";
import IconAddRounded from "@/icons/IconAddRounded";
import IconFolder from "@/icons/IconFolder";
import IconRename from "@/icons/IconRename";
import IconUnlocked from "@/icons/IconUnlocked";
import IconLocked from "@/icons/IconLocked";
import IconChevronDown from "@/icons/IconChevronDown";

interface Props {
    dir: Directory,
    SelectMultiple?: Function,
    selectable?: boolean,
    dropped?: (directory: Directory, event: any) => void
    updateUploading?: () => void
}
export default function DisplayDirectory({ dir, selectable, SelectMultiple, dropped, updateUploading }: Props) {
    const refName = useRef<any>(null);
    const refExpand = useRef<any>(null);
    const refOptions = useRef<any>(null);
    const [isNaming, setIsNaming] = useState(false);
    const [name, setName] = useState<string>(dir.name);
    const [shared, setShared] = useState(dir.shared);
    const [informCopy, setInformCopy] = useState("Copy link");
    const [open, setOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fs = useFiles();

    function clicked(w: any) {
        if (!selectable || !fs.state.selected) return;
        if (refName.current && !refName.current.contains(w.target)
            && refExpand.current && !refExpand.current.contains(w.target)
            && refOptions.current && !refOptions.current.contains(w.target)) {
            const rez = indexOfSelected(fs.state.selected, dir);
            if (SelectMultiple && w.shiftKey) {
                SelectMultiple(dir, rez !== -1);
            } else if (rez === -1) {
                fs.dispatch({
                    type: SettingActionType.SET_SELECTED,
                    selected: [...fs.state.selected, dir]
                })
                // setSelected(el => [...el, dir]);
            } else {
                fs.dispatch({
                    type: SettingActionType.SET_SELECTED,
                    selected: [...fs.state.selected.slice(0, rez), ...fs.state.selected.slice(rez + 1)]
                })
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
        } else {
            await fs.setName('directories', name, dir.id);
        }
    }

    function openDir() {
        const rez = indexOfSelected(fs.state.selected, dir);
        if (rez !== -1)
            fs.dispatch({
                type: SettingActionType.SET_SELECTED,
                selected: [...fs.state.selected.slice(0, rez), ...fs.state.selected.slice(rez + 1)]
            });
        fs.pressedDir(dir);
        // setDirHistory(prev => [...prev, dir])
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
        const error = await fs.changeSharing(dir, !shared);
        if (error)
            alert(error);
        else {
            setShared(!shared);
            dir.shared = !shared;
        }
    }

    const [tmout, setTmout] = useState<NodeJS.Timeout | null>(null);
    function copyClipboard() {
        navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/public/${new Date(dir.created_at).getTime()}/${dir.id}`);
        setInformCopy("Link Copied!");
        if (tmout) {
            clearTimeout(tmout);
        }
        setTmout(setTimeout(() => setInformCopy("Copy link"), 2000))
    }

    function onDrop(event: any) {
        if (dropped)
            dropped(dir, event);
    }

    async function moveSelected() {
        await fs.moveSelected(dir.id);
        if (updateUploading) updateUploading();
    }

    return (
        <AnimatedDropZone
            dragging={dragging}
            setDragging={setDragging}
            dropped={selectable && dropped ? onDrop : undefined}
            textClassName="text-quaternary text-2xl"
        >
            <div onClick={w => clicked(w)} className="card group overflow-hidden">
                <div className="flex justify-between overflow-hidden">
                    <SelectionBubble file={dir} selected={fs.state.selected}>
                        <div className="flex gap-2 items-center justify-center overflow-hidden">
                            <div className="w-6 h-6 m-auto block text-quaternary group-hover:text-tertiary transition-colors duration-200">
                                <IconFolder />
                            </div>
                            {isNaming ?
                                <form onSubmit={w => { w.preventDefault(); saveName(); }}>
                                    <input className="bg-primary outline-none" type="text" autoFocus value={name} onChange={w => setName(w.target.value)} onBlur={saveName} />
                                </form> :
                                <div onClick={() => openDir()} ref={refName} className="cursor-pointer hover:text-tertiary transition-colors whitespace-nowrap overflow-hidden">
                                    <StrechableText text={name} />
                                </div>}
                        </div>
                    </SelectionBubble>
                    <div ref={refExpand} className={`flex items-center gap-2`}>
                        {fs.state.selected.length > 0 ? <abbr className="cursor-pointer text-quaternary hover:text-tertiary transition-colors duration-200" onClick={moveSelected} title="Move to this directory"><IconAddRounded /></abbr> : ""}
                        <div onClick={() => setOpen(w => !w)} className={`relative w-6 h-6 text-quaternary cursor-pointer hover:text-tertiary transition-all ${open ? 'rotate-180' : ''}`}>
                            <IconChevronDown className="z-10" />
                        </div>
                    </div>
                </div>
                <div className={`transition-all ease-in-out duration-300 flex justify-between gap-1 select-none overflow-hidden ${open ? ' max-h-20  mt-1' : 'max-h-0'}`}>
                    <div className="grid gap-1 text-tertiary">
                        <p>Created {getReadableDate(dir.created_at)}</p>
                    </div>
                    <div ref={refOptions} className="grid gap-1">
                        {selectable ? <div onClick={() => shareManager()} className=" cursor-pointer text-quaternary hover:text-tertiary transition-colors duration-200">
                            {shared ? <div className="flex gap-2 items-center">
                                <p className="whitespace-nowrap">Stop sharing</p>
                                <abbr title="Stop sharing" className="w-6 h-6"><IconUnlocked /></abbr>
                            </div> : <div className="flex gap-2 items-center">
                                <p className="whitespace-nowrap">Start sharing</p>
                                <abbr className="w-6 h-6" title="Start sharing"><IconLocked /></abbr>
                            </div>}
                        </div> : ""}
                        {shared ? <div onClick={() => copyClipboard()} className="whitespace-nowrap flex gap-2 justify-end cursor-pointer text-quaternary hover:text-tertiary transition-colors duration-200">
                            <p>{informCopy}</p>
                            <abbr
                                title="Copy link"
                                className="w-6 h-6 ">
                                <IconLink className="mt-0.5" />
                            </abbr>
                        </div> : ''}
                        {!isNaming && selectable ? <div onClick={() => setIsNaming(w => !w)} className="whitespace-nowrap flex justify-end gap-2 items-center cursor-pointer text-quaternary hover:text-tertiary transition-colors duration-200">
                            <p>Rename</p>
                            <abbr className="w-6 h-6" title="Rename"><IconRename /></abbr>
                        </div> : ''}
                    </div>
                </div>
            </div>
        </AnimatedDropZone>
    )
}