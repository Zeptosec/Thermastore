import { PropsWithClass } from "@/utils/utils";

interface Props extends PropsWithClass {
    size?: number,
    offsetx?: number
}
export default function IconPlayButton({ className, size, offsetx }: Props) {

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
            <path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" fill="currentColor" />
        </svg>
    )
}
