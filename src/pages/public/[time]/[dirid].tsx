import PublicPage from "@/components/FileDisplay/PublicPage";
import { FilesContextProvider } from "@/context/FilesContext";
import { GetPublicRes } from "@/pages/api/getpublic";
import { Directory, PageItems } from "@/utils/FileFunctions";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function PublicFiles() {
    const router = useRouter();
    const { time, dirid } = router.query;
    const [ptime, setPTime] = useState(time);
    const [pdirid, setPDirId] = useState(dirid);
    const [browserBackForward, setBrowserBackForward] = useState({ changed: false, newDirId: '', newTime: '' });
    const [rootDir, setRootDir] = useState<Directory | undefined>();
    useEffect(() => {
        if (router.isReady && !ptime && !pdirid) {
            setPTime(time);
            setPDirId(dirid);
        }
    }, [router])

    async function getPublicItems(direc: Directory | null, search_str: string, from_num: number, to_num: number, order_column: 'name' | 'id' | 'size', order_dir: 'asc' | 'desc'): Promise<PageItems> {
        let intdir = parseInt((dirid) as string);
        let intime = parseInt((time) as string);

        if (!dirid) {
            return { files: [], dirs: [], hasNext: false, error: 'Missing directory id' };
        }

        if (!time) {
            return { files: [], dirs: [], hasNext: false, error: 'Missing time key' };
        }

        try {
            if (direc) {
                intdir = direc.id;
                intime = new Date(direc.created_at).getTime()
                console.log(direc);
            } else if (browserBackForward.changed) {
                setBrowserBackForward(w => ({ ...w, changed: false }));
                intdir = parseInt(browserBackForward.newDirId);
                intime = parseInt(browserBackForward.newTime);
            } else if (pdirid && ptime) {
                intdir = parseInt(pdirid as string);
                intime = parseInt(ptime as string);
            }

            const rs = await fetch('/api/getpublic?' + new URLSearchParams({
                direc: intdir.toString(),
                from: from_num.toString(),
                to: to_num.toString(),
                time: intime.toString(),
                search_str,
                order_column,
                order_dir
            }))

            const json: GetPublicRes = await rs.json();
            if (rs.ok) {
                if (!rootDir) setRootDir(json.currDir)
                return json.items as PageItems;
            } else {
                return { files: [], dirs: [], hasNext: false, error: json.error };
            }

        } catch (err: any) {
            console.error(err);
            return { files: [], dirs: [], hasNext: false, error: 'Failed to fetch: ' + err.message ? err.message : '' };
        }
    }

    function onPressedDir(dir: Directory | null) {
        const id = dir ? dir.id : pdirid;
        const tm = dir ? new Date(dir.created_at).getTime() : ptime;
        router.push(`/public/${tm}/${id}`, undefined, { shallow: true })
    }

    function OnBrowserBackForward(newUrl: string) {
        const q = newUrl.split('?');
        const parts = q[0].slice(1).split('/');
        if (parts.length === 3) {
            const newDirId = parts[parts.length - 1];
            const newTime = parts[parts.length - 2];
            setBrowserBackForward({
                changed: true,
                newDirId,
                newTime
            })
        }
    }

    return (
        <FilesContextProvider
            dataFunction={getPublicItems}
            dontUseParams={['d', 'g']}
            onPressedDir={onPressedDir}
            onBrowserBackForward={OnBrowserBackForward}
        >
            <Head>
                <meta name="description" content="Preview shared directory contents" />
                <title>{rootDir ? rootDir.name : "Shared directory"}</title>
            </Head>
            <PublicPage rootDir={rootDir} />
        </FilesContextProvider>
    )
}