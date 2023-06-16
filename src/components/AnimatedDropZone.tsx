import { ChangeEvent } from "react";
import DropZone from "./DropZone";

interface Props {
    setDragging: (newVal: boolean) => void,
    dragging: boolean,
    children: any,
    dropped?: (_files: FileList | null, event?: ChangeEvent<HTMLInputElement>) => void,
    textClassName?: string,
}

export default function AnimatedDropZone({ textClassName, children, dropped, setDragging, dragging }: Props) {

    return (
        dropped ?
            <DropZone
                Dropped={dropped}
                setDragging={setDragging}
                className={`relative`}
            >
                {/* Can be done with opacity wayyy easier but then everything is transparent :D */}
                <div className={`absolute z-10 pointer-events-none w-full h-full transition-all ${dragging ? `bg-sky-500/40` : `bg-none`}`}>
                    <div className={`flex justify-center items-center w-full h-full ${dragging ? `dashed-border` : ``}`}>
                        <div className={`transition-all ${dragging ? 'opacity-100' : 'opacity-0'}`}>
                            <p className={`${textClassName ? textClassName : `text-file sm:text-5xl text-3xl`}`}>Drop to upload</p>
                        </div>
                    </div>
                </div>
                {children}
            </DropZone> : children
    )
}