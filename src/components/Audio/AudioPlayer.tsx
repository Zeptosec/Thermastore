import IconPause from "@/icons/IconPause";
import IconPlayButton from "@/icons/IconPlayButton";
import { Clamp, PropsWithClass, formatSeconds } from "@/utils/utils";
import { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import InputRange from "./InputRange";
import IconVolume from "@/icons/IconVolume";
import IconClose from "@/icons/IconClose";
import StrechableText from "../StrechableText";
import IconSpinner from "@/icons/IconSpinner";
import IconRepeat from "@/icons/IconRepeat";
import IconPreviousTrack from "@/icons/IconPreviousTrack";
import IconNextTrack from "@/icons/IconNextTrack";

interface Props extends PropsWithClass {
    src: string,
    isPaused?: boolean,
    title?: string,
    repeat?: boolean,
    onClose?: () => void,
    onPrevious?: () => void,
    onNext?: () => void,
    onRepeat?: () => void,
    onPauseChanged?: (paused: boolean) => void,
    onPrecentageUpdated?: (precent: number) => void,
}
let audioWasNull = false;
// let frameID: number | undefined = undefined;
export default function AudioPlayer({ className, src, isPaused, repeat, onClose, onPrevious, onNext, onRepeat, onPauseChanged, onPrecentageUpdated, title }: Props) {
    const [paused, setPaused] = useState(false);
    const [currSeek, setCurrSeek] = useState(0);
    const [maxSeek, setMaxSeek] = useState(1);
    const [currBuff, setCurrBuff] = useState(0);
    const [currTimeText, setCurrTimeText] = useState('00:00');
    const [durationText, setDurationText] = useState('00:00');
    const [currVol, setCurrVol] = useState(100);
    const [buffering, setBuffering] = useState(true);
    const [isError, setIsError] = useState(false);
    const audioElem = useRef<HTMLAudioElement>(null);

    function recalculateBuffer() {
        if (audioElem.current) {
            try {
                if (audioElem.current.buffered.length > 0) {
                    const buff = audioElem.current.buffered.end(audioElem.current.buffered.length - 1);
                    setCurrBuff(buff);
                }
            } catch (err) {
                console.error(err);
                console.error("failed to get buffer");
            }
        }
    }

    function OnMetadataLoad() {
        recalculateBuffer();
        if (audioElem.current) {
            setMaxSeek(audioElem.current.duration);
            setDurationText(formatSeconds(audioElem.current.duration));
        }
    }

    function onEnded(forcedPause?: boolean) {
        const currPause = forcedPause ?? paused;
        if (currPause) return;
        togglePause(true);
        setCurrSeek(0);
        setCurrTimeText(formatSeconds(0));
        // if (frameID)
        //     cancelAnimationFrame(frameID);
        if (onNext) {
            onNext();
            if (repeat) {
                // have to wait for rerender because value is already false
                setTimeout(() => togglePause(false), 10);
            }
        } else if (repeat) {
            setTimeout(() => togglePause(false), 10);
        }
    }

    useEffect(() => {
        if (isPaused === undefined) {
            setPaused(true);
            if (onPauseChanged) onPauseChanged(true);
        } else {
            togglePause(isPaused);
        }
        setDurationText('00:00');
        setCurrSeek(0);
        if (audioWasNull) {
            setVolume(currVol);
        }
        audioWasNull = audioElem.current === null;
        // if (frameID) {
        //     cancelAnimationFrame(frameID);
        // }
    }, [src]);

    useEffect(() => {
        if (onPrecentageUpdated && maxSeek > 0) {
            onPrecentageUpdated(Clamp(0, 100, currSeek / maxSeek * 100))
        }
    }, [currSeek])
    useEffect(() => {
        if (isPaused !== undefined && isPaused !== paused) {
            togglePause();
        }
    }, [isPaused])

    function updatePlaying() {
        if (audioElem.current) {

            const seekValue = audioElem.current.currentTime;
            setCurrSeek(seekValue);
            setCurrTimeText(formatSeconds(seekValue));
            //frameID = requestAnimationFrame(updatePlaying);
        }
    }

    function togglePause(forcedState?: boolean) {
        if (!audioElem.current) return;
        const newState = forcedState ?? !paused;
        // if user drags the knob to the end and starts, otherwise it's going to restart the current clip
        // if (!newState && currSeek === Math.floor(maxSeek * 100) / 100) {
        //     console.log("ended toggle");
        //     onEnded(false);
        //     return;
        // }
        setPaused(newState);
        if (onPauseChanged) onPauseChanged(newState);
        if (!newState) {
            if (audioElem.current.paused)
                audioElem.current.play().catch(err => console.error(err));
            /// toggle pause usually gets called multiple times
            /// weird checking is needed to prevent requestAnimationFrame from exploding
            // if (frameID !== undefined && frameID !== -1) {
            //     cancelAnimationFrame(frameID);
            //     frameID = undefined;
            // }
            // if (frameID === undefined) {
            //     frameID = -1;
            //     requestAnimationFrame(updatePlaying);
            // }
        } else {
            audioElem.current.pause();
            // if (frameID) {
            //     cancelAnimationFrame(frameID);
            //     frameID = undefined;
            // }
        }
    }

    function changeSeek(value: number) {
        const seek = value;
        setCurrSeek(seek);
        setCurrTimeText(formatSeconds(seek));
        if (audioElem.current) {
            audioElem.current.currentTime = seek;
        }
    }

    function setVolume(val: number) {
        setCurrVol(val);
        if (audioElem.current) {
            audioElem.current.volume = Math.min(Math.max(val, 0), 100) / 100;
        }
    }

    function changeVolume(value: number) {
        const vol = value;
        setVolume(vol);
    }

    function toggleVolume() {
        if (currVol > 0) {
            setVolume(0);
        } else {
            setVolume(100);
        }
    }

    function audioError(event: SyntheticEvent<HTMLAudioElement, Event>) {
        togglePause(true);
        setIsError(true);
    }

    function onStart(forcedPause?: boolean) {
        if (currSeek === Math.floor(maxSeek * 100) / 100) {
            console.log("ended toggle");
            onEnded(false);
        } else {
            togglePause(forcedPause);
        }
    }

    return (
        <div className={`${className ? className : ''} w-full p-3 bg-primary flex flex-row justify-center flex-nowrap gap-2 text-quaternary items-center relative ${title ? 'sm:pt-8 pt-16' : 'sm:pt-3 pt-11'} `}>
            {src === 'loading' ? '' : <audio
                onPlaying={() => { setBuffering(false); setIsError(false); }}
                onWaiting={() => setBuffering(true)}
                onError={audioError}
                onEnded={() => { onEnded() }}
                onPause={() => { setTimeout(() => togglePause(true), 10) }}
                onPlay={() => { onStart(false) }}
                onLoadedMetadata={OnMetadataLoad}
                onProgress={recalculateBuffer}
                ref={audioElem}
                className="hidden"
                src={src}
                onTimeUpdate={() => updatePlaying()}
                preload="none"></audio>}
            {title ? <div className={`absolute top-1 overflow-hidden max-w-full sm:px-10 ${isError ? 'text-tertiary' : ''}`}><StrechableText text={isError ? "Failed to play audio" : title} /></div> : ''}
            <div className="order-2 sm:order-1 flex gap-2 items-center">
                {onPrevious ? <button className="outline-none hover:text-tertiary transition-colors" onClick={onPrevious}>
                    <IconPreviousTrack />
                </button> : ''}
                <button className="outline-none hover:text-tertiary transition-colors relative" onClick={() => onStart()}>
                    {paused ? <IconPlayButton size={3} offsetx={-1} /> : <IconPause size={3} />}
                    {buffering && !paused ? <IconSpinner className="absolute -top-1 -left-1 w-8 h-8" /> : ''}
                </button>
                {onNext ? <button className="outline-none hover:text-tertiary transition-colors" onClick={onNext}>
                    <IconNextTrack />
                </button> : ''}
                <span>{currTimeText} / {durationText}</span>
            </div>
            <div className={`order-1 sm:order-2 flex gap-2 flex-1 items-center w-full sm:static absolute sm:px-0 px-4 ${title ? 'top-9' : 'top-4'}`}>
                <InputRange onChange={changeSeek} max={maxSeek} value={currSeek} buffered={currBuff} className="flex-1" />
            </div>
            <div className="order-2 flex gap-2 items-center">
                <div className="flex items-center gap-2 group/volume">
                    <InputRange onChange={changeVolume} max="100" value={currVol} className="w-0 overflow-hidden group-hover/volume:w-[100px] transition-all" />
                    <button onClick={toggleVolume} className="relative outline-none hover:text-tertiary transition-colors">
                        <IconVolume />
                        <div className={`absolute border-b-[3px] top-0 left-1 border-tertiary ${currVol === 0 ? 'w-8' : 'w-0'} rotate-45 origin-left transition-all`}></div>
                    </button>
                </div>
                {onRepeat ? <button className={`outline-none ${repeat === undefined || !repeat ? 'hover:text-tertiary' : 'text-tertiary hover:text-quaternary'} transition-colors`} onClick={() => onRepeat()}>
                    <IconRepeat />
                </button> : ''}
                {onClose ? <button className="outline-none hover:text-tertiary transition-colors" onClick={() => onClose()}>
                    <IconClose />
                </button> : ''}
            </div>
        </div>
    )
}