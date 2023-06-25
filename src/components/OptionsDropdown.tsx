// Not used anywhere for whatever reason...

import { useEffect, useRef, useState } from "react"

interface Props {
    children: any,
    panelNames?: string,
    dropdownClass?: string,
    markerClass?: string,
}

export default function OptionsDropdown({ children, markerClass = '', panelNames = '', dropdownClass = 'gg-chevron-down' }: Props) {
    const [open, setOpen] = useState(false);
    const panel = useRef<HTMLDivElement>(null);
    const visible = useRef<HTMLDivElement>(null);

    function mouseDownEvent(w: MouseEvent) {
        if (panel.current) {
            //@ts-ignore
            // console.log(panel.current.contains(w.target))
            //@ts-ignore
            if (!panel.current.contains(w.target)) {
                setOpen(false);
            }
        }
    }

    let tmout: NodeJS.Timeout | null = null;
    function drop() {
        setOpen(w => !w);
        if (tmout) clearTimeout(tmout);
        tmout = setTimeout(() => {
            if (visible.current) {
                const rect = visible.current.getBoundingClientRect();
                const bpoint = rect.y + rect.height;
                if (window.innerHeight < bpoint) {
                    visible.current.style.top = `${window.innerHeight - rect.y - rect.height}px`
                }
            }
        }, 300)
    }

    useEffect(() => {
        if (open) {
            document.addEventListener('mousedown', mouseDownEvent);
        } else {
            document.removeEventListener('mousedown', mouseDownEvent);
            if (visible.current)
                visible.current.style.top = '';
        }
        return () => {
            document.removeEventListener('mousedown', mouseDownEvent);
        }
    }, [open])

    return (
        <div ref={panel} className="w-[22px] absolute">
            <div onClick={() => drop()} className={`${markerClass} text-blue-900 w-[22px] h-[22px] cursor-pointer hover:text-blue-600 transition-all ${open ? `${Math.random() > 0.5 ? 'rotate-180' : '-rotate-180'}` : ''}`}>
                <i className={`${dropdownClass} z-10`}></i>
            </div>
            <div ref={visible} className={`${panelNames} min-w-[150px] z-20 top-8 -right-2 absolute transition-all ease-in duration-300 overflow-hidden ${open ? 'max-h-32' : 'max-h-0'}`}>
                <div className={` bg-cyan-400/[.9] rounded-xl p-2 grid gap-3`}>
                    {children}
                </div>
            </div>
        </div>
    )
}