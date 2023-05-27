import { Directory, DirFile, indexOfSelected } from "@/utils/FileFunctions"

interface Props {
    children?: any,
    selected?: (Directory | DirFile)[]
    file: (Directory | DirFile)
}

export default function SelectionBubble({ children, selected, file }: Props) {

    return (
        <div className={`flex transition-all duration-200 items-center overflow-hidden ${selected && selected.length > 0 ? `gap-2` : ``}`}>
            <div>
                <div className={`border-file rounded-full cursor-pointer flex justify-center items-center transition-all duration-200 ${selected && selected.length > 0 ? `w-3.5 h-3.5 border` : `w-0 h-0`}`}>
                    <div className={`rounded-full w-2 h-2 bg-file transition-opacity duration-200 ${selected && indexOfSelected(selected, file) !== -1 ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}></div>
                </div>
            </div>
            {children}
        </div>
    )
}