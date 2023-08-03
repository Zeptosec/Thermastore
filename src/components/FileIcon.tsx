import IconDocument from "@/icons/IconDocument";
import IconFile from "@/icons/IconFile";
import IconFilm from "@/icons/IconFilm";
import IconImage from "@/icons/IconImage";
import IconMusic from "@/icons/IconMusic";
import { getFileType } from "@/utils/FileFunctions"


export default function FileIcon({ name, className }: { name: string, className?: string }) {
    const fileType = getFileType(name);
    switch (fileType) {
        case 'audio':
            return (<IconMusic />);
        case 'image':
            return (<IconImage />);
        case 'video':
            return (<IconFilm />);
        case 'text':
            return (<IconDocument />);
        default:
            return (<IconFile />);
    }
}