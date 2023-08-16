import { useEffect, useState } from "react";

interface Props {
    text: string,
}
export default function StrechableText({ text }: Props) {
    const [leftText, setLeftText] = useState("");
    const [rightText, setRightText] = useState("");

    useEffect(() => {
        if (text.length <= 10) {
            setLeftText(text);
            setRightText("");
            return;
        }
        let ind = text.lastIndexOf(".");
        if (ind === -1) ind = text.length;
        ind -= 3;
        setLeftText(text.slice(0, ind));
        setRightText(text.slice(ind));
    }, [text])

    return (
        <div className="flex overflow-hidden">
            <span className="text-left-side">{leftText}</span>
            <span className="text-right-side">{rightText}</span>
        </div>
    )
}