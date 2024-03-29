import { useEffect, useRef } from "react"

export default function DropZone({ children, Dropped, setDragging, className }: any) {
    const drop = useRef<any>(null);
    let val: number = 0;

    useEffect(() => {
        let localRef: any = null;
        if (drop.current) localRef = drop.current;
        drop.current.addEventListener('dragover', handleDragOver);
        drop.current.addEventListener('drop', handleDrop);
        drop.current.addEventListener('dragenter', handleDragEnter);
        drop.current.addEventListener('dragleave', handleDragLeave);

        return () => {
            localRef.removeEventListener('dragover', handleDragOver);
            localRef.removeEventListener('drop', handleDrop);
            localRef.removeEventListener('dragenter', handleDragEnter);
            localRef.removeEventListener('dragleave', handleDragLeave);
        }
    }, [])

    function handleDragEnter(e: any) {
        e.preventDefault();
        e.stopPropagation();
        if (val === 0) {
            setDragging(true);
        }
        val += 1;
    }

    function handleDragLeave(e: any) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
            if (val === 1) {
                setDragging(false);
            }
            val -= 1;
        }, 50);
    }

    function handleDragOver(w: DragEvent) {
        w.preventDefault();
        w.stopPropagation();
    }

    const handleDrop = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        Dropped(e);
        val = 0;
        setDragging(false);
    };
    return (
        <div className={`overflow-hidden ${className}`}>
            <input onChange={w => Dropped(w)} className="hidden" type="file" id="file-uploader" multiple />
            <div className='select-none' ref={drop}>
                {children}
            </div>
        </div>
    )
}