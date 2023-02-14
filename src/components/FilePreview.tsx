import { BytesToReadable } from "@/utils/FileFunctions"
import StrechableText from "./StrechableText"

interface PreviewFile {
    file: File,
    remove: Function
}
export default function FilePreview({ file, remove }: PreviewFile) {

    return (
        <div className="relative text-lg flex justify-between items-center gap-2">
            <div className="flex gap-2 items-center overflow-hidden">
                <abbr onClick={() => remove(file)} title="Remove from the list"><i className="gg-close-r cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr>
                <div className="flex overflow-hidden">
                    <StrechableText text={file.name} />
                </div>
            </div>
            <p className="whitespace-nowrap">{BytesToReadable(file.size)}</p>
        </div>
    )
}