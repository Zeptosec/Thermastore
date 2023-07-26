import { Files } from "@/context/FilesContext";
import { NextRouter } from "next/router";

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