export const chunkSize = 8 * 1024 ** 2;

const marks = ["B", "KB", "MB", "GB", "TB", "PB"];

/**
 * 
 * @param size Number of bytes to be converted to readable format.
 * @returns Formatted string of readable size.
 */
export function BytesToReadable(size: number, precision: number = 2) {
    let ind = 0;
    const bytesToNext = 1024;
    while (size > bytesToNext) {
        ind++;
        if (ind >= marks.length) {
            ind--;
            break;
        }
        size /= bytesToNext;
    }
    return `${Math.round(size * 10 ** precision) / (10 ** precision)} ${marks[ind]}`;
}

/**
 * 
 * @param seconds Amount of seconds to convert to readable string.
 * @returns A readable string with days, hours, minutes and seconds.
 */
export function TimeToReadable(seconds: number) {
    let secs = Math.round(seconds % 60);
    let minutes = Math.floor(seconds / 60) % 60;
    let hours = Math.floor(seconds / 3600) % 24;
    let days = Math.floor(seconds / 86400);
    let str = "";
    if (days > 0) {
        str += `${days}d`;
    }
    if (hours > 0 || str.length > 0) {
        if (str.length > 0) str += " ";
        str += `${hours}h`;
    }
    if (minutes > 0 || str.length > 0) {
        if (str.length > 0) str += " ";
        str += `${minutes}min`
    }
    if (str.length > 0) str += " ";
    str += `${secs}s`;
    return str;
}