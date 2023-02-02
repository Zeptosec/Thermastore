import { BytesToReadable } from "@/utils/FileFunctions"

interface PreviewFile {
    file: File,
    remove: Function
}
export default function FilePreview({ file, remove }: PreviewFile) {

    return (
        <div className="relative text-lg flex justify-between items-center">
            <p>{file.name}</p>
            <p>{BytesToReadable(file.size)}</p>
            <button onClick={w => remove(file)} className="close absolute left-[-25px] top-[4px]"><i className="gg-close-o"></i></button>
        </div>
    )
}