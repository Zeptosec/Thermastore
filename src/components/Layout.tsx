import Navbar from "./Navbar";

export default function layout({ children }: any) {


    return (
        <>
            <Navbar />
            <main className="text-white -z-20">{children}</main>

        </>
    )
}