import { BytesToReadable } from "@/utils/FileFunctions"

interface PreviewFile {
    file: File,
    remove: Function
}
export default function FilePreview({ file, remove }: PreviewFile) {

    return (
        <div className="relative text-lg flex justify-between items-center">
            <div className="flex gap-2 items-center">
                <abbr onClick={() => remove(file)} title="Remove from the list"><i className="gg-close-r cursor-pointer transition-colors duration-200 hover:text-blue-700"></i></abbr>
                <p>{file.name}</p>
            </div>
            <p>{BytesToReadable(file.size)}</p>
        </div>
    )
}