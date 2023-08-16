import { PropsWithClass } from "@/utils/utils";

interface Props extends PropsWithClass {
    size?: number,
    offsetx?: number
}
export default function IconNextTrack({ className, size, offsetx }: Props) {

    const ofx = offsetx ? offsetx : 0;
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox={size ? `${size + ofx} ${size} ${24 - size * 2} ${24 - size * 2}` : `${ofx} 0 24 24`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M6 17L14 12L6 7V17Z" fill="currentColor" />
            <path d="M18 7H15V12V17H18V7Z" fill="currentColor" />
        </svg>

    )
}
