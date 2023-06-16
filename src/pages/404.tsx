import AnimatedDropZone from "@/components/AnimatedDropZone";
import BubbleBackground from "@/components/BubbleBackground";
import DropZone from "@/components/DropZone";
import OptionsDropdown from "@/components/OptionsDropdown";
import { useState } from "react";

export default function NotFound() {
    const [dragging, setDragging] = useState(false);

    function handleFile(item: any, path?: string) {
        path = path || "";
        if (item.isFile) {
            // Get file
            item.file(function (file: any) {
                console.log("File:", path + file.name);
            });
        } else if (item.isDirectory) {
            // Get folder contents
            var dirReader = item.createReader();
            dirReader.readEntries(function (entries: any) {
                for (var i = 0; i < entries.length; i++) {
                    handleFile(entries[i], path + item.name + "/");
                }
            });
        }
    }

    function dropped(files: FileList | null, event: any) {
        let items = event.dataTransfer.items;
        for (let i = 0; i < items.length; i++) {
            let item = items[i].webkitGetAsEntry();
            if (item) {
                if (item.isDirectory)
                    handleFile(item);
            }
        }

    }
    return (
        <div>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="text-center grid gap-8">
                    <p className="text-8xl">Ooops...</p>
                    <p className="text-3xl">It seems that you're lost</p>
                    <AnimatedDropZone dragging={dragging} setDragging={setDragging} dropped={dropped}>
                        <div className="py-4">
                            Upload
                        </div>
                    </AnimatedDropZone>
                </div>
            </div>
        </div>
    )
}