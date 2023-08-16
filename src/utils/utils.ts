import { Files } from "@/context/FilesContext";
import { NextRouter } from "next/router";

export interface PropsWithClass {
    className?: string
}

export function changeTheme(theme: string) {
    const htmls = document.getElementsByTagName('html');
    // assume first html in the collections is the one with theme attribute
    const html = htmls[0];
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

export interface RouteParams {
    p?: number, // page
    d?: number, // directory
    q?: string, // search query
    g?: boolean // is global query
}

/**
 * Processes router query and returns them formatted in a better format.
 * @param router Router to get the query from.
 * @returns Processed url query parameters.
 */
export function getRouterParams(router: NextRouter): RouteParams {
    let rez: RouteParams = {};
    if (router.query.p && !Array.isArray(router.query.p)) {
        try {
            rez.p = parseInt(router.query.p);
        } catch (err) {
            console.log(err);
            console.log("failed to parse string to number")
        }
    }
    if (router.query.d && !Array.isArray(router.query.d)) {
        try {
            rez.d = parseInt(router.query.d);
        } catch (err) {
            console.log(err);
            console.log("failed to parse string to number")
        }
    }
    if (router.query.q && !Array.isArray(router.query.q)) {
        rez.q = router.query.q;
    }
    if (router.query.g && !Array.isArray(router.query.g)) {
        rez.g = router.query.g.toLowerCase() === 'true';
    }
    return rez;
}

export function createRouteParams(infoFiles: Files) {
    const rez: any = {};
    if (infoFiles.currPage > 1) {
        rez.p = infoFiles.currPage;
    }

    if (infoFiles.dirHistory.length > 0) {
        rez.d = infoFiles.dirHistory[infoFiles.dirHistory.length - 1].id;
    }

    if (infoFiles.searchStr) {
        rez.q = infoFiles.searchStr;
    }

    if (infoFiles.isGlobal) {
        rez.g = infoFiles.isGlobal;
    }

    return new URLSearchParams(rez);
}

export function getRouteParamsFromPath(path: string): RouteParams {
    let rez: RouteParams = {};
    const parts = path.split("?");
    if (parts.length === 2) {
        const urlParams = new URLSearchParams(parts[1]);
        const p = urlParams.get('p')
        if (p) {
            try {
                rez.p = parseInt(p);
            } catch (err) {
                console.log(err);
                console.log("Failed to parse to number")
            }
        }

        const d = urlParams.get('d')
        if (d) {
            try {
                rez.d = parseInt(d);
            } catch (err) {
                console.log(err);
                console.log("Failed to parse to number")
            }
        }

        const q = urlParams.get('q');
        if (q)
            rez.q = q;

        const g = urlParams.get('g');
        if (g)
            rez.g = g === 'true';
    }
    return rez;
}

/**
 * Checks if url string is a valid URL. Fails on special cases...
 * @param url string of url to check
 * @returns true if url is valid. Otherwise false.
 */
export function isValidUrl(url: string): boolean {
    try {
        const nurl = new URL(url);
        return nurl.protocol === "http:" || nurl.protocol === "https:";
    } catch (_) {
        return false;
    }

}

/**
 * Extracts subdomain from streamer link to be used as name.
 * @param url streamer link
 * @returns subdomain or domain if subdomain is not defined.
 */
export function getStreamerName(url: string): string {
    const lastDot = url.lastIndexOf('.');
    const protocolInd = url.indexOf('://');
    if (lastDot !== -1) {
        const beforeLastDot = url.lastIndexOf('.', lastDot - 2);
        if (beforeLastDot !== -1) {
            return url.slice(beforeLastDot + 1, lastDot);
        } else {
            return url.slice(protocolInd + 3, lastDot);
        }
    } else {
        // this should never fire
        if (protocolInd !== -1) {
            return url.slice(protocolInd + 3);
        } else {
            // could not find dot or slashes after protocal
            return url;
        }
    }
}

export function formatSeconds(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? `0${sec}` : sec}`;
}

/**
 * Clamps value between minimum and maximum.
 * @param min Minimum value.
 * @param max Maximum value.
 * @param value Value to clamp between minimum and maximum.
 * @returns Clamped value.
 */
export function Clamp(min: number, max: number, value: number) {
    return Math.max(min, Math.min(max, value));
}