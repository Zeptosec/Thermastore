import { BytesToReadable } from "@/utils/FileFunctions"
import StrechableText from "./StrechableText"
import IconCloseRounded from "@/icons/IconCloseRounded"

interface PreviewFile {
    file: File,
    remove: Function
}
export default function FilePreview({ file, remove }: PreviewFile) {

    return (
        <div className="relative text-lg flex justify-between items-center gap-2">
            <div className="flex gap-2 items-center overflow-hidden">
                <abbr onClick={() => remove(file)} className="cursor-pointer transition-colors duration-200 hover:text-quaternary" title="Remove from the list"><IconCloseRounded /></abbr>
                <div className="flex overflow-hidden">
                    <StrechableText text={file.name} />
                </div>
            </div>
            <p className="whitespace-nowrap">{BytesToReadable(file.size)}</p>
        </div>
    )
}