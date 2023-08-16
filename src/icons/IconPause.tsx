import { PropsWithClass } from "@/utils/utils";

interface Props extends PropsWithClass {
    size?: number
}
export default function IconPause({ className, size }: Props) {

    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox={size ? `${size} ${size} ${24 - size * 2} ${24 - size * 2}` : `0 0 24 24`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M11 7H8V17H11V7Z" fill="currentColor" />
            <path d="M13 17H16V7H13V17Z" fill="currentColor" />
        </svg>
    )
}
