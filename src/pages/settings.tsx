import BubbleBackground from "@/components/BubbleBackground";
import CoolButton from "@/components/CoolButton";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import axios from "axios";
import { useEffect, useState } from "react";

interface hookID {
    id: number,
    hookNumber: string
}

export default function settingsPage() {
    const [hooksID, setHooksID] = useState<hookID[]>([]);
    const { isLoading, session, error } = useSessionContext();
    const [pageLoading, setPageLoading] = useState(true);
    const supabase = useSupabaseClient();
    const [msg, setMsg] = useState("Loading user...");
    const [hook, setHook] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (isLoading) return;
            setMsg("Checking for data");
            const { data, error, count } = await supabase
                .from("webhooks")
                .select("id, hookNumber", { count: "estimated" });
            if (error) {
                setMsg(error.message);
            } else {
                if (count && count > 0) {
                    setHooksID(data);
                }
                setPageLoading(false);
            }
        }
        fetchData();
    }, [isLoading]);

    async function addHook() {
        const parts = hook.split('/');
        //console.log(parts);
        if (parts.length !== 7) {
            setErr("Not a valid hook");
            return;
        }
        if(hooksID.find(w => w.hookNumber === parts[parts.length - 2])) {
            setErr("Hook already exists");
            return;
        }
        try {
            const res = await axios.post(`https://discordapp.com/api/webhooks/${parts[parts.length - 2]}/${parts[parts.length - 1]}`, { content: "This message was sent to verify hook. Make sure all hooks point to the same channel." });
        } catch (err) {
            setErr("Not a valid hook");
            console.log(err);
            return;
        }
        const thahook = { hookNumber: parts[parts.length - 2], hookId: parts[parts.length - 1] }
        if (hooksID.length < 4) {
            const { data, error } = await supabase
                .from('webhooks')
                .insert(thahook)
                .select('id')
                .single();
            if (error) {
                setErr(error.message);
                console.log(error);
                return;
            }
            setHooksID(w => [...w, { id: data.id, hookNumber: parts[parts.length - 2] }])
            setHook(`https://discordapp.com/api/webhooks/0000000000000000000/...`);
            setErr("hook was set successfully");
        }
    }

    async function deleteHook() {
        if (hooksID.length === 0) return;
        const { error } = await supabase
            .from("webhooks")
            .delete()
            .eq('id', hooksID[0].id);
        if (error) {
            setErr(error.message);
            console.log(error);
            return;
        }
        setErr("hook deleted! " + hooksID[0].id);
        setHooksID(w => w.slice(1))
        setHook("");
    }

    return (
        <div>
            <BubbleBackground />
            <div className="h-100vh py-[72px] px-4">
                {pageLoading ? <p className="text-4xl text-center">{msg}</p> :
                    <div className="grid gap-2 text-center">
                        <div>
                            <p className="m-0 text-red-500">Disclaimer: Your hooks won't be encrypted. Anyone with your account can access them.</p>
                            <p className="m-0">{hooksID.length > 0 ? `You have (${hooksID.length}) hooks and you can delete it here` : "You can set up a hook here"}</p>
                        </div>
                        <input className="w-64 m-auto text-black p-2 rounded-md text-xl" onChange={w => setHook(w.target.value)} placeholder={`https://discordapp.com/api/webhooks/...`} value={hook} type="text" />
                        <CoolButton onClick={() => addHook()}>Add hook</CoolButton>
                        {hooksID.length > 0 ? <CoolButton onClick={() => deleteHook()}>Delete hook</CoolButton> : ""}
                        <p className="text-red text-xl">{err}</p>
                    </div>}
            </div>
        </div>
    )
}