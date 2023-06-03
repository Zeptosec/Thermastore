import Navbar from "./Navbar";

export default function layout({ children, isUploading }: any) {
    
    
    return (
        <>
            <Navbar isUploading={isUploading} />
            <main className="text-white -z-20">{children}</main>

        </>
    )
}