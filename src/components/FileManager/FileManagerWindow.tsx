import { FileActionType, FileManager } from "@/context/FileManagerContext";
import FileManagerDownload from "./FileManagerDownload";
import FileManagerUpload from "./FileManagerUpload";
import IconClose from "@/icons/IconClose";

interface Props {
    fileManager?: FileManager,
    className?: string,
    user?: boolean,
    dispatch?: Function
}
export default function FileManagerWindow({ fileManager, user, className, dispatch }: Props) {
    return (
        <div className={className}>
            {dispatch ? <div
                onClick={() => dispatch({ type: FileActionType.TOGGLE_MENU })}
                className="absolute right-1 top-1 cursor-pointer hover:text-tertiary transition-all"
            >
                <IconClose />
            </div> : ''}
            {(fileManager && (fileManager.uploading.length > 0 || fileManager.downloading.length > 0)) ? <div className="overflow-hidden flex flex-col">
                {fileManager.uploading.length > 0 ? <>
                    <p className="text-center border-b border-quaternary pb-2">Uploading {fileManager.uploading.filter(w => w.finished).length}/{fileManager.uploading.length}</p>
                    {fileManager.uploading.map((w, ind) => <FileManagerUpload key={`u${w.file.name}${ind}`} status={w} user={user ? user : false} />)}
                </> : ''}
                {fileManager.downloading.length > 0 ? <>
                    <p className={`text-center border-b border-quaternary pb-2 ${fileManager.uploading.length > 0 ? 'pt-2' : ''}`}>Downloading</p>
                    {fileManager.downloading.map((w, ind) => <FileManagerDownload key={`d${w.name}${ind}`} status={w} />)}
                </> : ''}
            </div> : <p className=" whitespace-nowrap text-center">Nothing here</p>}
        </div>
    )
}