import AudioPlayer from "@/components/Audio/AudioPlayer";
import { Dispatch, createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import useFileManager from "./FileManagerContext";
import { Endpoint } from "@/utils/FileUploader";
import { getEarliestEnd } from "@/utils/FileDownload";
import { Clamp } from "@/utils/utils";

export const AudioContext = createContext<Exposed | null>(null);
interface PlayInfo {
    cid: string,
    fid: string,
    title?: string
}
export interface AudioList {
    list: PlayInfo[],
    currentIndex: number,
    loop: boolean,
    paused: boolean,
    open: boolean,
    shouldPlay: boolean
}

export enum ActionType {
    'LOOP', 'PLAY', 'REMOVE', 'CLEAR', 'CLOSE', 'PAUSE', 'NEXT', 'PREVIOUS', 'TOGGLE_PAUSE', 'REMOVE_CURRENT', 'LOAD'
}

export type Action = {
    type: ActionType.PLAY,
    file: PlayInfo
} | {
    type: ActionType.LOOP,
} | {
    type: ActionType.CLEAR
} | {
    type: ActionType.REMOVE
} | {
    type: ActionType.CLOSE
} | {
    type: ActionType.PAUSE,
    paused: boolean
} | {
    type: ActionType.NEXT
} | {
    type: ActionType.PREVIOUS
} | {
    type: ActionType.TOGGLE_PAUSE
} | {
    type: ActionType.REMOVE_CURRENT
} | {
    type: ActionType.LOAD,
    data: AudioList
}

interface Exposed {
    state: AudioList,
    dispatch: Dispatch<Action>,
    playedPrecentage: number,
    playingFileId: string // file id of playing audio
}
const maxListSize = 20;
export function AudioProvider({ children }: any) {
    const fm = useFileManager();
    const [url, setUrl] = useState<string | undefined>();
    const [forceUrlIndex, setForceUrlIndex] = useState(0);
    const [playingFileId, setPlayingFileId] = useState("");

    function reducer(state: AudioList, action: Action): AudioList {
        switch (action.type) {
            case ActionType.PLAY:
                if (state.list.length === 0)
                    setUrl("loading");
                const fileInd = state.list.findIndex(w => w.fid === action.file.fid);
                if (fileInd !== -1) {
                    return {
                        ...state,
                        currentIndex: fileInd,
                        // paused: false,
                        open: true,
                        shouldPlay: true
                    }
                }
                let newList = [...state.list, action.file]
                // check if list has reached max list size
                if (newList.length > maxListSize) {
                    newList.shift();
                }
                return {
                    ...state,
                    currentIndex: newList.length - 1,
                    list: [...newList],
                    // paused: false,
                    open: true,
                    shouldPlay: true
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
                    loop: !state.loop
                }
            case ActionType.CLEAR:
                return {
                    ...state,
                    list: [],
                    currentIndex: 0
                }
            case ActionType.CLOSE:
                return {
                    ...state,
                    open: false,
                    paused: true,
                }
            case ActionType.PAUSE:
                return {
                    ...state,
                    paused: action.paused
                }
            case ActionType.NEXT:
                let nextInd = state.currentIndex + 1;
                if (nextInd >= state.list.length) {
                    if (state.loop) {
                        nextInd = 0;
                        if (nextInd === state.currentIndex) setForceUrlIndex(w => w + 1);
                    }
                    else
                        return state;
                }

                return {
                    ...state,
                    currentIndex: nextInd,
                    shouldPlay: true,
                }
            case ActionType.PREVIOUS:
                let prevInd = state.currentIndex - 1;
                if (prevInd < 0) {
                    if (state.loop) {
                        prevInd = state.list.length - 1;
                    } else
                        return state;
                }
                return {
                    ...state,
                    currentIndex: prevInd,
                    shouldPlay: true
                }
            case ActionType.TOGGLE_PAUSE:
                return {
                    ...state,
                    paused: !state.paused,
                    open: true
                }
            case ActionType.REMOVE_CURRENT:
                if (state.currentIndex === -1 || state.currentIndex > state.list.length) return state;
                const newListLen = state.list.length - 1;
                if (state.currentIndex !== newListLen)
                    setForceUrlIndex(w => w + 1);
                return {
                    ...state,
                    list: [...state.list.slice(0, state.currentIndex), ...state.list.slice(state.currentIndex + 1)],
                    open: newListLen !== 0,
                    currentIndex: newListLen === 0 ? -1 : Clamp(0, newListLen - 1, state.currentIndex),
                    paused: newListLen === 0 || state.paused
                };
            case ActionType.LOAD:
                if (action.data.list.length === 0) return state;
                return {
                    list: action.data.list,
                    open: true,
                    paused: true,
                    loop: action.data.loop,
                    currentIndex: action.data.currentIndex,
                    shouldPlay: false
                }
            default:
                console.log(`Not supported with such parameters`, action);
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, { list: [], currentIndex: -1, loop: false, paused: true, open: true, shouldPlay: false });
    const [streamerPreviousTime, setStreamerPreviousTime] = useState(0);
    const [streamer, setStreamer] = useState<Endpoint | undefined>();
    const [playedPrecentage, setPlayedPrecentage] = useState(0);
    const exposed: Exposed = {
        state,
        dispatch,
        playedPrecentage,
        playingFileId
    }

    function changeUrl(endpoint: Endpoint) {
        if (state.list.length === 0) return;
        const file = state.list[state.currentIndex];
        // passing a function to force re-render in case the url is the same as previous.
        // this is for audio looping in case the list contains only one clip.
        setUrl(() => `${endpoint.link}/stream/${file.cid}/${file.fid}`);
        if (state.shouldPlay)
            dispatch({
                type: ActionType.PAUSE,
                paused: false
            });
    }

    function saveToStorage() {
        localStorage.setItem('playlist', JSON.stringify(state));
    }

    useEffect(() => {
        const prevListStr = localStorage.getItem('playlist');
        if (prevListStr) {
            const prevList: AudioList = JSON.parse(prevListStr);
            dispatch({
                type: ActionType.LOAD,
                data: prevList
            })
        }
    }, []);
    const firstUpdate = useRef(true);
    useEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false;
            return;
        }
        saveToStorage();
    }, [state.list, state.loop, state.currentIndex]);

    useEffect(() => {
        if (state.currentIndex === -1) setPlayingFileId("");
        async function fetchEnd() {
            const endpoint = await getEarliestEnd(fm.streamers);
            setStreamer(endpoint);
            changeUrl(endpoint);
        }
        if (fm.isLoading || state.currentIndex === -1) return;
        const currTime = new Date().getTime()
        if (streamerPreviousTime + 10 * 60 * 1000 < currTime) {
            setStreamerPreviousTime(currTime);
            fetchEnd();
        } else if (streamer) {
            changeUrl(streamer);
        }
        if (state.list.length > 0)
            setPlayingFileId(state.list[state.currentIndex].fid);
    }, [state.currentIndex, fm.isLoading, forceUrlIndex, streamer, state.list])
    return (
        <AudioContext.Provider value={exposed}>
            {children}
            {url ? <section className={`${state.open ? 'sm:pb-[69px] pb-[100px]' : 'pb-0'} transition-all`}>
                <div className={`fixed w-full z-50 transition-all ${state.open ? 'bottom-0' : '-bottom-[100px]'}`}>
                    <AudioPlayer
                        src={url}
                        title={state.list.length === 0 ? undefined : state.list[state.currentIndex].title}
                        isPaused={state.paused}
                        repeat={state.loop}
                        onClose={() => dispatch({ type: ActionType.REMOVE_CURRENT })}
                        onPrevious={() => dispatch({ type: ActionType.PREVIOUS })}
                        onNext={() => dispatch({ type: ActionType.NEXT })}
                        onRepeat={() => dispatch({ type: ActionType.LOOP })}
                        onPauseChanged={newPause => dispatch({ type: ActionType.PAUSE, paused: newPause })}
                        onPrecentageUpdated={prc => setPlayedPrecentage(prc)} />

                </div>
            </section> : ''}
        </AudioContext.Provider>
    )
}

export default function useAudio() {
    const context = useContext<Exposed | null>(AudioContext);
    if (!context) throw new Error("Missing AudioContextProvider in parent!");
    return context;
}