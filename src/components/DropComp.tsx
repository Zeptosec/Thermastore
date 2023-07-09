import { useState } from "react";
import DropZone from "./DropZone";
import FilePreview from "./FilePreview";

export default function DropComp({ filesChanged, files, remove }: any) {
    const [dragging, setDragging] = useState<boolean>(false);

    return (
        <DropZone className={"grid items-end"} Dropped={filesChanged} setDragging={setDragging}>
            <div className="drop-area text-4xl text-center" data-active={dragging}>
                {!dragging ?
                    <label htmlFor="file-uploader" className="group cursor-pointer">
                        <div>
                            Drag your files here or <i className="underline group-hover:text-tertiary transition-colors duration-300"><u>click here</u></i>
                        </div>
                    </label> :
                    <div>
                        Drop Here
                    </div>}
                <div className={files.length > 0 ? `mt-10` : ``}>
                    {files.map((w: File, ind: number) => <FilePreview key={ind} remove={remove} file={w} />)}
                </div>
            </div>
        </DropZone>
    )
}