
interface Props {
    paused: boolean,
    currentTime: number
}

export default function PlayCircle({ paused, currentTime }: Props) {

    return (
        <div>
            <style jsx>{`
        circle {
            fill: white;
            stroke: black;
            stroke-width: 2;
            stroke-dasharray: 250;
            stroke-dashoffset: 1000;
            animation: rotate 5s linear infinite;
          }
      `}</style>
            <svg height="22" width="22">
                <circle cx="10" cy="10" r="9" />
            </svg>
        </div>
    )
}