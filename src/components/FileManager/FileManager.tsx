import { Exposed, FileActionType } from "@/context/FileManagerContext";
import FileManagerWindow from "./FileManagerWindow";
import { User } from "@supabase/supabase-js";

interface Props {
    fm: Exposed | null,
    user: User | null
}

export default function FileManager({ fm, user }: Props) {


    const downCnt = fm?.state.downloading.filter(w => !w.finished).length;
    const upCnt = fm?.state.uploading.filter(w => !w.finished).length;
    let totalCnt = 0;
    if (downCnt) totalCnt += downCnt;
    if (upCnt) totalCnt += upCnt;
    if (totalCnt > 99) totalCnt = 99;
    return (
        <>
            <button onClick={() => fm?.dispatch({ type: FileActionType.TOGGLE_MENU })} className="relative outline-none text-quaternary px-2 hover:text-tertiary transition-colors">
                <i className="gg-arrows-exchange"></i>
                {totalCnt > 0 ? <div className="absolute top-3 left-4 text-green-800 rounded-full bg-red-400 w-4 h-4 -z-10 flex justify-center items-center font-bold text-xs">{totalCnt}</div> : ""}
            </button>
            <FileManagerWindow fileManager={fm?.state} user={user !== null} dispatch={fm?.dispatch}
                className={`sm:absolute text-quaternary fixed scrollbar border-secondary grid gap-2 overflow-y-auto bg-primary/80 sm:bg-primary/90 sm:rounded-lg rounded-t-lg transition-all duration-300 sm:max-w-[400px] ${fm?.state.showMenu ? 'sm:max-h-[400px] w-screen p-2 h-[calc(100vh-72px)] sm:h-auto sm:top-[50px] top-[72px] right-0 sm:shadow-infopanel sm:border-2 border' : 'sm:max-h-0 max-sm:h-0 w-0 top-2 shadow-none right-4'}`} />
        </>
    )
}