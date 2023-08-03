import { PropsWithClass, changeTheme } from "@/utils/utils";
import { useEffect, useState } from "react";
import CoolButton from "../CoolButton";
import { themes } from "@/pages/_app";


export default function ThemeSelector({ className }: PropsWithClass) {
    const [theme, setTheme] = useState<string>("default");

    useEffect(() => {
        let t = localStorage.getItem('theme');

        if (t) {
            setTheme(t);
        }
    }, []);
    return (
        <div className={`grid gap-2 ${className}`}>
            <p className="text-2xl underline">Themes</p>
            <div className="flex gap-2 flex-wrap justify-center">
                {themes.map((w, ind) => (
                    <div key={w + ind}>
                        <CoolButton onClick={() => { changeTheme(w); setTheme(w) }} disabled={theme === w}>{w}</CoolButton>
                    </div>
                ))}
            </div>
        </div>
    )
}