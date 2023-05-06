import { Directory, equalDir } from "@/utils/FileFunctions";
import { Dispatch, SetStateAction } from "react";

export default function Pathline({ dirHistory, setDirHistory }: { dirHistory: Directory[], setDirHistory: Dispatch<SetStateAction<Directory[]>> }) {

    function pressedPath(dir: Directory) {
        if (dirHistory.length === 0) return;
        if (!equalDir(dirHistory[dirHistory.length - 1], dir)) {
            setDirHistory(d => d.slice(0, d.findIndex(b => equalDir(b, dir)) + 1))
        }
    }

    function pressedRoot(){
        setDirHistory(w => w.length > 0 ? [] : w)
    }

    return (
        <div className="flex px-5">
            <p onClick={() => pressedRoot()} className="cursor-pointer transition-colors duration-200 hover:text-blue-700">/root</p>
            {dirHistory.length > 0 ? <>
                {dirHistory[0].dir !== null ? <p>/..</p> : ''}
            </> : ""}
            {dirHistory.map(w => (
                <div key={`path${w.id}`}>
                    {/* For path access */}
                    <p onClick={() => pressedPath(w)} className="cursor-pointer transition-colors duration-200 hover:text-blue-700">/{w.name}</p>
                </div>
            ))}
        </div>
    )
}