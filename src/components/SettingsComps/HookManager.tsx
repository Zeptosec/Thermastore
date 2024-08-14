import { PropsWithClass } from "@/utils/utils";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import CoolButton from "../CoolButton";
import { VerifyHook } from "@/utils/FileFunctions";

export default function HookManager({ className }: PropsWithClass) {
    const supabase = useSupabaseClient();

    const [hasHook, setHasHook] = useState(false);
    const [hookID, setHookID] = useState<number>();
    const [hook, setHook] = useState("");
    const [err, setErr] = useState("");
    const [loadingData, setLoadingData] = useState<'loading' | 'loaded' | 'initializing'>("initializing");

    async function SetTheHook() {
        const validHook = await VerifyHook(hook);
        if (!validHook.isValid) {
            setErr("Not a valid hook");
            console.log(err);
            return;
        }
        const thahook = { hookNumber: validHook.hookNumber, hookId: validHook.hookId }
        if (hasHook) {
            const { error } = await supabase
                .from("webhooks")
                .update(thahook)
                .eq('id', hookID);
            if (error) {
                setErr(error.message);
                console.log(error);
                return;
            }
        } else {
            const { data, error } = await supabase
                .from('webhooks')
                .insert(thahook)
                .select('id').single()
            if (error) {
                setErr(error.message);
                console.log(error);
                return;
            }
            setHookID(data.id)
        }
        setHook(`https://discordapp.com/api/webhooks/0000000000000000000/...`);
        setErr("hook was set successfully");
        setHasHook(true);
    }

    async function deleteHook() {
        const { error } = await supabase
            .from("webhooks")
            .delete()
            .eq('id', hookID);
        if (error) {
            setErr(error.message);
            console.log(error);
            return;
        }
        setErr("hook deleted!");
        setHasHook(false);
        setHook("");
    }

    useEffect(() => {
        async function fetchData() {
            if (loadingData === 'loading') return;
            setLoadingData("loading");
            setErr('Fetching hook from the server');
            const { data, error, count } = await supabase
                .from("webhooks")
                .select("id", { count: "estimated" });
            if (error) {
                setErr(error.message);
            } else {
                setErr("");
                if (count && count > 0) {
                    setHasHook(true);
                    setHookID(data[0].id);
                    setHook(`https://discordapp.com/api/webhooks/0000000000000000000/...`)
                }
                setLoadingData('loaded');
            }
        }
        fetchData();
    }, [])
    return (
        <div className={`grid gap-2 ${className}`}>
            <p className="text-2xl underline">Hook</p>
            {loadingData === 'loading' || loadingData === 'initializing' ? <>
                <p className="text-center text-tertiary">{err}</p>
            </> : <>
                <div>
                    <p className="m-0">{hasHook ? "You have a hook and you can change or delete it here" : "You can set up a hook here"}</p>
                </div>
                <input className="w-64 m-auto text-quaternary bg-primary p-2 rounded-md text-xl placeholder:text-quaternary/50" onChange={w => setHook(w.target.value)} placeholder="https://discordapp.com/api/webhooks/..." value={hook} type="text" />
                <div className="flex flex-wrap gap-2 justify-center">
                    <CoolButton onClick={() => SetTheHook()}>Set hook</CoolButton>
                    {hasHook ? <CoolButton onClick={() => deleteHook()}>Delete hook</CoolButton> : ""}
                </div>
                <p className="text-red text-xl">{err}</p>
            </>}
        </div>
    )
}