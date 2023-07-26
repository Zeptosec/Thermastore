import FilesPage from "@/components/FileDisplay/FilesPage";
import { FilesContextProvider } from "@/context/FilesContext";

export default function MyFiles() {

    return (
        <FilesContextProvider>
            <FilesPage />
        </FilesContextProvider>
    )
}