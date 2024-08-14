import useFileManager from "@/context/FileManagerContext";
import IconAddRounded from "@/icons/IconAddRounded";
import IconClose from "@/icons/IconClose";
import { PropsWithClass, isValidUrl } from "@/utils/utils";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface StreamerInfo {
    id: number,
    link: string
}

export interface StoredStreams {
    links: string[],
    time: number
}

export default function StreamersManager({ className }: PropsWithClass) {
    const supabase = useSupabaseClient();
    const fm = useFileManager();
    const [currStreamerText, setCurrStreamerText] = useState<string>('');
    const [streamers, setStreamers] = useState<StreamerInfo[]>([])
    const [isSavingLink, setIsSavingLink] = useState(false);

    useEffect(() => {

        async function fetchStreams() {
            const { data, error } = await supabase
                .from('streamers')
                .select('link,id');
            if (error) {
                console.error(error);
            } else {
                setStreamers(data);
                fm.setNewStreamers(data.map(w => w.link), true);
            }
        }

        fetchStreams();
    }, []);

    async function addStreamer() {
        if (isSavingLink) return;
        setIsSavingLink(true);
        try {
            if (!isValidUrl(currStreamerText)) {
                alert("URL is not valid");
                return;
            } else {
                try {
                    const rs = await fetch(currStreamerText);
                    const txt = await rs.text();
                    if (!txt.startsWith("Alive")) {
                        alert("Service is unresponsive or not valid");
                        return;
                    }
                } catch (err) {
                    console.error(err);
                    alert("Failed to fetch url: " + currStreamerText);
                    return;
                }
            }
            let linkToAdd = currStreamerText.trim();
            while (linkToAdd[linkToAdd.length - 1] === '/') {
                linkToAdd = linkToAdd.slice(0, -1);
            }
            const { data, error } = await supabase
                .from('streamers')
                .insert({
                    link: linkToAdd
                })
                .select('link, id')
                .single();
            if (error) {
                console.error(error);
                alert("Failed to save streamer service link. You have reached the maximum amount of links you can have saved!");
            } else {
                const newStreamsArr = [...streamers, data]
                setStreamers(newStreamsArr);
                fm.setNewStreamers(newStreamsArr.map(w => w.link), true);
                setCurrStreamerText('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingLink(false);
        }

    }

    async function deleteStreamer(streamer: StreamerInfo) {
        if (!confirm(`Are you sure you want to delete ${streamer.link}?`)) return;
        const { error } = await supabase
            .from('streamers')
            .delete()
            .eq('id', streamer.id);
        if (error) {
            console.error(error);
            alert("Failed to delete " + streamer.link);
        } else {
            const ind = streamers.findIndex(w => w.id === streamer.id);
            if (ind !== -1) {
                const newStreamsArr = [...streamers.slice(0, ind), ...streamers.slice(ind + 1)]
                setStreamers(newStreamsArr)
                fm.setNewStreamers(newStreamsArr.map(w => w.link), true);
            }
            alert("Successfully deleted " + streamer.link);
        }
    }

    return (
        <div className={`grid gap-2 ${className}`}>
            <p className="text-2xl underline">Streamers</p>
            <p className="m-0">Specify links to your hosted streamer services to be able to watch videos, play audio, preview images and download directly from this website.</p>
            <p>Here are some sites that let you deploy this service for free:</p>
            <div className="flex gap-2 justify-center flex-wrap">
                <a href="https://render.com/deploy?repo=https://github.com/Zeptosec/Streamer" target="_blank">
                    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
                </a>
                <a href="https://app.koyeb.com/deploy?type=git&repository=github.com/Zeptosec/Streamer&branch=master&run_command=yarn%20run%20start:prod&name=streamer-koyeb">
                    <img src="https://www.koyeb.com/static/images/deploy/button.svg" alt="Deploy to Koyeb" />
                </a>
            </div>
            <p>Add service links down below (max 5)</p>
            <div className="flex justify-center gap-1">
                <input onChange={w => setCurrStreamerText(w.target.value)} value={currStreamerText} className="rounded-lg min-w-[300px] p-2 bg-primary outline-none placeholder:text-quaternary/50" type="text" name="link" id="link" maxLength={256} placeholder="https://streamer.onrender.com" />
                <button disabled={isSavingLink} onClick={addStreamer}>
                    <IconAddRounded className={`${isSavingLink ? 'text-tertiary' : 'text-quaternary hover:text-tertiary'} transition-colors w-10 h-10`} />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {streamers.map(w => <div key={`streamer${w.id}`} className="flex gap-1 bg-primary rounded-lg p-2">
                    <p>{w.link}</p>
                    <button onClick={() => deleteStreamer(w)}>
                        <IconClose className="text-quaternary hover:text-tertiary transition-colors" />
                    </button>
                </div>)}
            </div>
            <p>You can always run <Link className="underline hover:text-tertiary transition-colors" href="https://github.com/Zeptosec/Streamer">the streamer</Link> on your own computer.</p>
        </div>
    )
}