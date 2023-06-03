import { DirFile, getFileType } from "@/utils/FileFunctions";
import { Dispatch, createContext, useContext, useReducer } from "react";

export const AudioContext = createContext<Exposed | null>(null);
export interface AudioList {
    list: DirFile[],
    currentIndex: number,
    loop: boolean,
    paused: boolean
}

export enum ActionType {
    'LOOP', 'ADD', 'REMOVE', 'CLEAR'
}

export type Action = {
    type: ActionType.ADD,
    payload: DirFile
} | {
    type: ActionType.LOOP,
    payload: boolean
} | {
    type: ActionType.CLEAR
} | {
    type: ActionType.REMOVE
}

interface Exposed {
    state: AudioList,
    dispatch: Dispatch<Action>
}

export default function AudioProvider({ children }: any) {

    function reducer(state: AudioList, action: Action): AudioList {
        switch (action.type) {
            case ActionType.ADD:
                if (getFileType(action.payload.name) !== 'audio') {
                    console.log("can't play not audio file");
                    return state;
                }
                return {
                    ...state,
                    currentIndex: state.list.length + 1,
                    list: [...state.list, action.payload],
                    paused: false
                }
            case ActionType.REMOVE:
                if (state.list.length === 0) return state;
                let curr = state.currentIndex;
                if (curr + 1 === state.list.length && curr !== 0) {
                    curr -= 1;
                }
                return {
                    ...state,
                    currentIndex: curr,
                    list: [...state.list.slice(0, state.currentIndex), ...state.list.slice(state.currentIndex + 1)]
                }
            case ActionType.LOOP:
                return {
                    ...state,
                    loop: action.payload
                }
            case ActionType.CLEAR:
                return {
                    ...state,
                    list: [],
                    currentIndex: 0
                }
            default:
                console.log(`Not supported with such parameters`, action);
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, { list: [], currentIndex: 0, loop: false, paused: true });

    const exposed: Exposed = {
        state,
        dispatch
    }

    return (
        <AudioContext.Provider value={exposed}>
            {/* <div className="pb-[46px]"> */}
                {children}
                {/* <div className=" z-40 fixed bottom-0 px-5 py-3 w-screen bg-blue-900/80 backdrop-blur-md flex">
                    <div className="flex gap-3 flex-1 items-center justify-center">
                        <div className="flex-none">
                            <i className="gg-play-button scale-150"></i>
                        </div>
                        <div className="flex-1">
                            <input className="w-full" type="range" />
                        </div>
                    </div>
                </div>
            </div> */}
        </AudioContext.Provider>
    )
}

export const useAudio = () => useContext<Exposed | null>(AudioContext);