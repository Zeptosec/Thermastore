import useFilesSettings, { SettingActionType } from "@/context/FilesContext";
import Head from "next/head";
import CoolLoader from "../CoolLoading2";
import Pathline from "../Pathline";
import IconUpload from "@/icons/IconUpload";
import { Directory, UpFiles } from "@/utils/FileFunctions";
import CoolSearch from "../CoolSearch";
import { useEffect, useState } from "react";
import AnimatedDropZone from "../AnimatedDropZone";
import useFileManager from "@/context/FileManagerContext";
import DisplayFiles from "./DisplayFiles";
import { FileStatus } from "@/utils/FileUploader";
import IconArrowLeft from "@/icons/IconArrowLeft";
import IconAddRounded from "@/icons/IconAddRounded";
import IconFolderAdd from "@/icons/IconFolderAdd";
import IconCloseRounded from "@/icons/IconCloseRounded";
import IconArrowRight from "@/icons/IconArrowRight";
import IconTrash from "@/icons/IconTrash";
import IconGlobe from "@/icons/IconGlobe";

export default function FilesPage() {
    const [dragging, setDragging] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timer | undefined>();
    const [uploadingHere, setUploadingHere] = useState<FileStatus[]>([])
    const fs = useFilesSettings();
    const fm = useFileManager();

    function onSearchChanged(searchStr: string): void {
        clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            fs.dispatch({
                type: SettingActionType.GET_ITEMS,
                searchStr,
                page: 1
            });
        }, 1000))
    }

    function updateDirs(direcs: Directory[]) {
        fs.dispatch({ type: SettingActionType.SET_ITEMS, files: fs.state.files, dirs: [...direcs, ...fs.state.dirs], canNext: fs.state.canNext });
    }

    function getCurrDir() {
        if (fs.state.dirHistory.length > 0)
            return fs.state.dirHistory[fs.state.dirHistory.length - 1];
    }

    function uploadToDir(dir: Directory | undefined, event: any) {
        fm.uploadToDir(dir, event, updateDirs, getCurrDir);
    }

    function getFilesUpHere() {
        const currDir = fs.state.dirHistory[fs.state.dirHistory.length - 1];
        const filesHere = fm.state.uploading.filter(w => {
            const cid = currDir ? currDir.id : null;
            const tid = w.directory ? w.directory.id : null;

            return cid === tid && !w.finished;
        });
        return filesHere;
    }

    function updateUploading() {
        const filesHere = getFilesUpHere();
        setUploadingHere(filesHere);
    }

    // for certain cases had to create another useEffect. Like for adding a file after another was uploaded would remove previous from visible.
    useEffect(() => {
        const filesHereToAdd = getFilesUpHere().filter(w => uploadingHere.findIndex(a => a.file === w.file) === -1);
        setUploadingHere(filesUpHere => [...filesHereToAdd, ...filesUpHere]);
    }, [fm.state.uploading]);

    useEffect(updateUploading, [fs.state.dirHistory, fs.state.isLoading]);

    return (<div className="h-full bg-secondary text-quaternary">
        <Head>
            <title>{fs.state.dirHistory.length > 0 ? `${fs.state.dirHistory[fs.state.dirHistory.length - 1].name}` : 'MyFiles'}</title>
        </Head>
        {/* <BubbleBackground /> */}
        <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[90px] text-quaternary">
            <div className="grid gap-4 pb-4">
                {fs.state.isLoading ? <>
                    <CoolLoader />
                    <p className="pt-32 text-2xl text-center">Fetching files...</p>
                </> : <>
                    <Pathline dirHistory={fs.state.dirHistory} pressedDir={fs.pressedDir} />
                    <div className="flex justify-between px-3 h-6">
                        <div className="flex gap-2 items-center">
                            {fs.state.dirHistory.length > 0 ? <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-6" title="Back" onClick={() => fs.pressedBack()}><IconArrowLeft /></abbr> : ""}
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary" title="New directory" onClick={() => fs.addFolder()}>
                                <IconFolderAdd />
                            </abbr>
                            <abbr title="Upload here">
                                <label htmlFor="file-uploader" className="transition-colors duration-200 hover:text-tertiary cursor-pointer ">
                                    <IconUpload />
                                </label>
                            </abbr>
                        </div>
                        {fs.state.selected.length > 0 ? <div className="flex gap-2 items-center">
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-6 h-6 flex justify-center items-center" onClick={() => fs.moveSelected(fs.state.dirHistory.length > 0 ? fs.state.dirHistory[fs.state.dirHistory.length - 1].id : null)} title="Move selected here"><IconAddRounded /></abbr>
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-6 h-6 flex justify-center items-center" onClick={() => fs.dispatch({ type: SettingActionType.SET_SELECTED, selected: [] })} title="Deselect all"><IconCloseRounded /></abbr>
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-6 h-6 flex justify-center items-center" onClick={() => fs.deleteSelected()} title="Delete selected"><IconTrash /></abbr>
                        </div> : ""}
                        <div className="flex items-center gap-2">
                            <abbr title="Search for files"><CoolSearch inputChanged={onSearchChanged} text={fs.state.searchStr} /></abbr>
                            <abbr onClick={() => fs.dispatch({ type: SettingActionType.GET_ITEMS, isGlobal: !fs.state.isGlobal, page: 1, dir: null })} className={`cursor-pointer transition-colors duration-200 ${fs.state.isGlobal ? "text-tertiary hover:text-quaternary/60" : "text-quaternary hover:text-tertiary/60"}`} title={`Global search is ${fs.state.isGlobal ? "enabled" : "disabled"}`}><IconGlobe /></abbr>
                        </div>
                    </div>
                    {/* <div className="grid gap-4 pb-4"> */}
                    <AnimatedDropZone
                        dragging={dragging}
                        setDragging={setDragging}
                        dropped={(event: any) => uploadToDir(getCurrDir(), event,)}
                    >
                        <div className="grid gap-2">
                            <DisplayFiles
                                selectable={true}
                                fs={uploadingHere}
                                dropped={uploadToDir}
                                updateUploading={updateUploading}
                            />
                            {fs.state.currPage > 1 || fs.state.canNext ? <div className={`flex justify-between items-center px-3`}>
                                <div>
                                    {fs.state.currPage > 1 ? <div className=" cursor-pointer transition-colors duration-200 hover:text-tertiary">
                                        <abbr onClick={() => fs.dispatch({ type: SettingActionType.GET_ITEMS, page: fs.state.currPage - 1 })} title="Previous page">
                                            <IconArrowLeft />
                                        </abbr>
                                    </div> : ""}
                                </div>
                                <div>
                                    {fs.state.canNext ? <div className=" cursor-pointer transition-colors duration-200 hover:text-tertiary">
                                        <abbr onClick={() => fs.dispatch({ type: SettingActionType.GET_ITEMS, page: fs.state.currPage + 1 })} title="Next page">
                                            <IconArrowRight />
                                        </abbr>
                                    </div> : ""}
                                </div>
                            </div> : ""}
                        </div>
                    </AnimatedDropZone>
                    {/* </div> */}
                </>}
            </div>
        </div>
    </div>)
}