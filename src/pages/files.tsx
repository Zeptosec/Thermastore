import BubbleBackground from "@/components/BubbleBackground";
import CoolLoader from "@/components/CoolLoading2";
import { useSessionContext, useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export interface DataFile{
    id: number,
    name: string,
    size: number,
    data: string,
}

export default function filesPage() {
    const { isLoading, session, error } = useSessionContext();
    const user = useUser();
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [msg, setMsg] = useState("Loading user...");
    const [stillLoading, setStillLoading] = useState(true);
    const [files, setFiles] = useState<Array<DataFile>>([]);
    useEffect(() => {
        if (isLoading) return;

        async function fetchData(){
            setMsg("Fetching info about files...");
            const res = await supabase.from('files').select()
        }
        fetchData();
        //fetch files
    }, [isLoading, user]);
    return (
        <div>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4">
                <div className="grid gap-4">
                    {stillLoading ? <>
                        <CoolLoader />
                        <p className="pt-32 text-2xl text-white">{msg}</p>
                    </> : <>

                    </>}
                </div>
            </div>

        </div>
    )
}