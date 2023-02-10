import { Directory, DirFile } from "@/utils/FileFunctions"
import { Dispatch, SetStateAction, useRef } from "react"

interface Props {
    dir: Directory,
    setDirHistory: Dispatch<SetStateAction<number[]>>,
    selected: (DirFile | Directory)[],
    setSelected: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    MoveSelected: Function
}
export default function DirItem({ dir, setDirHistory, selected, setSelected, MoveSelected }: Props) {
    const refName = useRef<any>(null);

    function clicked(w: any) {
        if (refName.current && !refName.current.contains(w.target)) {
            const rez = selected.findIndex(el => el.created_at === dir.created_at);
            if (rez === -1) setSelected(el => [...el, dir]);
            else setSelected(el => [...el.slice(0, rez), ...el.slice(rez + 1)]);
        }
    }

    return (
        <div onClick={w => clicked(w)} className="flex justify-between card group">
            <div className={`flex transition-all duration-200 items-center ${selected.length > 0 ? `gap-2` : ``}`}>
                <div className={`border-blue-900 rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 ${selected.length > 0 ? `w-3.5 h-3.5 border` : `w-0 h-0`}`}>
                    <div className={`rounded-full w-2 h-2 bg-blue-700 transition-opacity duration-200 ${selected.findIndex(w => w.created_at === dir.created_at) !== -1 ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}></div>
                </div>
                <div className="flex gap-2 items-center justify-center">
                    <div className="w-5 h-4 m-auto sm:block hidden">
                        <i className="gg-folder m-auto text-blue-900 group-hover:text-blue-700 transition-colors duration-200"></i>
                    </div>
                    <p ref={refName} onClick={w => setDirHistory(prev => [...prev, dir.id])} className="cursor-pointer">{dir.name}</p>
                </div>
            </div>
            {selected.length > 0 ? <div className={`cursor flex items-center text-blue-900 hover:text-blue-700 transition-colors duration-200`}>
                <abbr title="Move to this directory"><i onClick={() => MoveSelected(dir.id, false)} className={`gg-add-r cursor-pointer`}></i></abbr>
            </div> : ""}
        </div>
    )
}