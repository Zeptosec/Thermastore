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
export default function AudioPlayer({ className, src, isPaused, repeat, onClose, onPrevious, onNext, onRepeat, onPauseChanged, onPrecentageUpdated, title }: Props) {
    const [paused, setPaused] = useState(true);
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

    /// pressing play and pause while audio is loading gives an error:
    // The play() request was interrupted by a call to pause().
    function pauseAudio() {
        if (audioElem.current && !audioElem.current.paused)
            audioElem.current.pause();
    }

    /// problem with audio load when loading and trying to play another
    // would be easy solution if i could stop loading
    // trying to play new audio while current is loading gives an error:
    // The play() request was interrupted by a new load request.
    function playAudio() {
        if (audioElem.current && audioElem.current.paused) {
            audioElem.current.play();
        }
    }
    function onEnded() {
        if (onNext) onNext();
        setCurrSeek(0);
        setCurrTimeText(formatSeconds(0));
        if (repeat && !onNext) {
            playAudio();
        }
    }

    useEffect(() => {
        const newPause = isPaused ?? true;
        if (!newPause) {
            if (audioElem.current) {
                audioElem.current.currentTime = 0;
                playAudio();
            }
        }
        if (audioWasNull) {
            setVolume(currVol);
        }
        audioWasNull = audioElem.current === null;
    }, [src])

    useEffect(() => {
        if (onPrecentageUpdated && maxSeek > 0) {
            onPrecentageUpdated(Clamp(0, 100, currSeek / maxSeek * 100))
        }
    }, [currSeek])

    useEffect(() => {
        if (isPaused !== undefined && audioElem.current && isPaused !== audioElem.current.paused) {
            if (audioElem.current.paused) {
                playAudio();
            } else {
                pauseAudio();
            }
        }
    }, [isPaused])

    function updatePlaying() {
        if (audioElem.current) {
            const seekValue = audioElem.current.currentTime;
            setCurrSeek(Clamp(0, maxSeek, seekValue));
            setCurrTimeText(formatSeconds(seekValue));
        }
    }

    function changeSeek(value: number) {
        const seek = value;
        setCurrSeek(seek);
        setCurrTimeText(formatSeconds(seek));
        if (audioElem.current) {
            const seekRoof = maxSeek - 0.1;
            audioElem.current.currentTime = Clamp(0, seekRoof < 10 ? maxSeek * .99 : seekRoof, seek);
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

    function changePause(newVal: boolean) {
        setPaused(newVal);
        if (onPauseChanged) onPauseChanged(newVal);
    }

    function toggleVolume() {
        if (currVol > 0) {
            setVolume(0);
        } else {
            setVolume(100);
        }
    }

    function audioError() {
        pauseAudio();
        setIsError(true);
    }

    function onPlay() {
        changePause(false);
    }

    function pressedClose() {
        if (onClose) onClose();
    }

    function onPaused() {
        changePause(true);
    }

    function PlayButton() {
        if (audioElem.current) {
            if (audioElem.current.paused) {
                playAudio();
            } else {
                pauseAudio();
            }
        }
    }

    return (
        <div className={`${className ? className : ''} w-full p-3 bg-primary flex flex-row justify-center flex-nowrap gap-2 text-quaternary items-center relative ${title ? 'sm:pt-8 pt-16' : 'sm:pt-3 pt-11'} `}>
            {src === 'loading' ? '' : <audio
                onPlaying={() => { setBuffering(false); setIsError(false); }}
                onWaiting={() => setBuffering(true)}
                onError={audioError}
                onEnded={() => { onEnded() }}
                onPause={onPaused}
                onPlay={onPlay}
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
                <button className="outline-none hover:text-tertiary transition-colors relative" onClick={() => PlayButton()}>
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
                {onClose ? <button className="outline-none hover:text-tertiary transition-colors" onClick={pressedClose}>
                    <IconClose />
                </button> : ''}
            </div>
        </div>
    )
}