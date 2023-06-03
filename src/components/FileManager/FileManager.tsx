import { Exposed, FileActionType } from "@/context/FileManagerContext";
import FileManagerWindow from "./FileManagerWindow";
import { User } from "@supabase/supabase-js";

interface Props {
    fm: Exposed | null,
    user: User | null
}

export default function FileManager({fm, user}:Props) {



    return (
        <>
            <button onClick={() => fm?.dispatch({ type: FileActionType.TOGGLE_MENU })} className=" outline-none text-file px-2 hover:text-filehover">
                <i className="gg-arrows-exchange"></i>
            </button>
            <FileManagerWindow fileManager={fm?.state} user={user !== null} dispatch={fm?.dispatch}
                className={`sm:absolute fixed border-cyan-500 grid gap-2 overflow-hidden bg-file/80 sm:bg-blue-700/90 text-white sm:rounded-lg rounded-t-lg transition-all duration-300 sm:max-w-[400px] ${fm?.state.showMenu ? 'sm:max-h-[400px] w-screen p-2 h-[calc(100vh-72px)] sm:h-auto sm:top-[50px] top-[72px] right-0 sm:shadow-infopanel sm:border-2 border' : 'sm:max-h-0 max-sm:h-0 w-0 top-2 shadow-none right-4'}`} />
        </>
    )
}