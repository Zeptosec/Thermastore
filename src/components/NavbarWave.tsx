import { useEffect, useState } from "react"

export default function NavbarWave() {
    const [d, setd] = useState('M0,256L48,261.3C96,267,192,277,288,282.7C384,288,480,288,576,272C672,256,768,224,864,213.3C960,203,1056,213,1152,229.3C1248,245,1344,267,1392,277.3L1440,288L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z');
    const [int, setInt] = useState<NodeJS.Timer | undefined>();

    useEffect(() => {
        clearInterval(int);
        setInt(setInterval(() => {

        }, 100));
        return () => {
            clearInterval(int);
        }
    }, [])
    return (
        <svg preserveAspectRatio="none" className="transition-all absolute" height={90} width="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path id="wave" fill="currentColor" className="text-primary" fillOpacity="1" d={d}></path>
        </svg>
    )
}