import useFiles, { SettingActionType } from "@/context/FilesContext";
import CoolLoader from "../CoolLoading2";
import CoolSearch from "../CoolSearch";
import Pathline from "../Pathline";
import DisplayFiles from "./DisplayFiles";
import { useState } from "react";
import { Directory } from "@/utils/FileFunctions";
import IconArrowLeft from "@/icons/IconArrowLeft";
import IconAddRounded from "@/icons/IconAddRounded";
import IconCloseRounded from "@/icons/IconCloseRounded";
import IconArrowRight from "@/icons/IconArrowRight";
import IconTrash from "@/icons/IconTrash";

interface Props {
    rootDir?: Directory
}
export default function PublicPage(props: Props) {
    const fs = useFiles();
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timer | undefined>();

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

    return (
        <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[90px] text-quaternary">
            <div className="grid gap-4 pb-4">
                {fs.state.error ? <>
                    <p className="pt-32 text-2xl text-center">{fs.state.error}</p>
                </> : fs.state.isLoading ? <>
                    <CoolLoader />
                    <p className="pt-32 text-2xl text-center">Fetching files...</p>
                </> : <>
                    <Pathline dirHistory={fs.state.dirHistory} pressedDir={fs.pressedDir} rootDir={props.rootDir} />
                    <div className="flex justify-between px-3 h-6">
                        <div className="flex gap-2 items-center">
                            {fs.state.dirHistory.length > 0 ? <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary" title="Back" onClick={() => fs.pressedBack()}><IconArrowLeft /></abbr> : ""}
                        </div>
                        {fs.state.selected.length > 0 ? <div className="flex gap-2 items-center">
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-[22px] h-[22px] flex justify-center items-center" onClick={() => fs.moveSelected(fs.state.dirHistory.length > 0 ? fs.state.dirHistory[fs.state.dirHistory.length - 1].id : null)} title="Move selected here"><IconAddRounded /></abbr>
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-[22px] h-[22px] flex justify-center items-center" onClick={() => fs.dispatch({ type: SettingActionType.SET_SELECTED, selected: [] })} title="Deselect all"><IconCloseRounded /></abbr>
                            <abbr className="cursor-pointer transition-colors duration-200 hover:text-tertiary w-[22px] h-[22px] flex justify-center items-center" onClick={() => fs.deleteSelected()} title="Delete selected"><IconTrash /></abbr>
                        </div> : ""}
                        <div className="flex items-center gap-2">
                            <abbr title="Search for files"><CoolSearch inputChanged={onSearchChanged} text={fs.state.searchStr} /></abbr>
                        </div>
                    </div>
                    {/* <div className="grid gap-4 pb-4"> */}
                    <div className="grid gap-2">
                        <DisplayFiles
                            selectable={false}
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
                                    <abbr title="Next page" onClick={() => fs.dispatch({ type: SettingActionType.GET_ITEMS, page: fs.state.currPage + 1 })} >
                                        <IconArrowRight />
                                    </abbr>
                                </div> : ""}
                            </div>
                        </div> : ""}
                    </div>
                    {/* </div> */}
                </>}
            </div>
        </div>
    )
}