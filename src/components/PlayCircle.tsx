import IconPause from "@/icons/IconPause";
import IconPlayButton from "@/icons/IconPlayButton";

interface Props {
    percent?: number,
    paused?: boolean
    radius: number,
    stroke: number,
    onClick?: any,
    className?: string
}

export default function PlayCircle({ percent, radius, stroke, paused, onClick, className }: Props) {
    let normalizedRadius = radius - stroke;
    let circumference = normalizedRadius * 2 * Math.PI;
    let prc = percent ?? 0;
    let isPaused = paused ?? true;
    return (
        <div className={`relative ${className}`} onClick={onClick}>
            <style jsx>{`
        circle {
            transition: stroke-dashoffset 0.2s;
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
        }
      `}</style>
            <svg
                height={`${radius * 2}`}
                width={`${radius * 2}`}
                className="text-tertiary"
            >
                <circle
                    stroke="currentColor"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset: `${circumference - prc / 100 * circumference}` }}
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            {isPaused ?
                <abbr className="absolute -top-[1px] left-0" title="Play"><IconPlayButton /></abbr> :
                <abbr className="absolute -top-[1px] -left-[1px]" title="Pause"><IconPause /></abbr>}
        </div >
    )
}