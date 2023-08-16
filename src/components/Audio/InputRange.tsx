import { Clamp, PropsWithClass } from "@/utils/utils";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import styles from '@/styles/InputRange.module.css';

interface Props extends PropsWithClass {
    onChange: (value: number) => void,
    value: string | number,
    buffered?: number,
    max?: string | number,
    precision?: number
}
export default function InputRange({ className, onChange, value, max, buffered, precision = 2 }: Props) {
    const [localPrec, setLocalPrec] = useState(Math.pow(10, Clamp(0, 3, precision)));
    const [localMax, setLocalMax] = useState(Number(max ? max : 100) * Math.pow(10, Clamp(0, 3, precision)));
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const _prec = Math.pow(10, Clamp(0, 3, precision))
        const _max = Number(max ? max : 100) * _prec;
        setLocalMax(_max);
        setLocalPrec(_prec);
    }, [max, precision])

    useEffect(() => {
        if (input.current && value !== undefined && max) {
            const currSeconds = Number(value);
            const maxSeconds = Number(max);
            const currPrc = currSeconds / maxSeconds * 100;
            input.current.style.setProperty('--seek-before-width', `${currPrc}%`);
        }
    }, [value, max]);

    useEffect(() => {
        if (input.current && buffered && max) {
            const currSeconds = Number(buffered);
            const maxSeconds = Number(max);
            const currPrc = currSeconds / maxSeconds * 100;
            input.current.style.setProperty('--buffered-width', `${currPrc}%`);
        }
    }, [buffered])

    function changed(event: ChangeEvent<HTMLInputElement>) {
        const number = Math.round(Number(event.target.value));
        if (!isNaN(number))
            onChange(number / localPrec);
    }

    return (
        <input ref={input} type="range" value={Number(value) * localPrec} onChange={changed} max={localMax} className={`${className ? className : ''} ${styles.input}`} />
    );
}