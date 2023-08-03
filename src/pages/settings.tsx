import Head from "next/head";
import HookManager from "@/components/SettingsComps/HookManager";
import StreamersManager from "@/components/SettingsComps/StreamersManager";
import ThemeSelector from "@/components/SettingsComps/ThemeSelector";

export default function settingsPage() {

    return (
        <div>
            {/* <BubbleBackground /> */}
            <Head>
                <title>Settings</title>
                <meta key="desc" property='og:description' content='Change your theme, add streamer services and add your own custom hook.' />
            </Head>
            <div className="h-100vh py-[100px] px-4 text-quaternary">
                <p className="text-center text-4xl pb-8">Settings</p>
                <div className="grid gap-2 text-center pb-8 max-w-[1000px] m-auto">
                    <HookManager />
                    <StreamersManager />
                    <ThemeSelector />
                </div>
            </div>
        </div>
    )
}