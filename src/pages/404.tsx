import AnimatedDropZone from "@/components/AnimatedDropZone";
import BubbleBackground from "@/components/BubbleBackground";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";

export default function NotFound() {
    const [dragging, setDragging] = useState(false);
    const supabase = useSupabaseClient();



    return (
        <div>
            {/* <BubbleBackground /> */}
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4 py-[72px]">
                <div className="text-center grid gap-8">
                    <p className="text-8xl">Ooops...</p>
                    <p className="text-3xl">It seems that you're lost</p>
                    {/* <button onClick={tryInsert}>Test</button> */}

                </div>
            </div>
        </div>
    )
}