import BubbleBackground from "@/components/BubbleBackground";

export default function NotFound() {

    return (
        <div>
            <BubbleBackground />
            <div className="grid items-center h-100vh max-w-[800px] m-auto px-4 gap-4">
                <div className="text-center grid gap-8">
                    <p className="text-8xl">Ooops...</p>
                    <p className="text-3xl">Page not found</p>
                </div>
            </div>
        </div>
    )
}