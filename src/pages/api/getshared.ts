import { Directory, DirFile, fetchFilesFromDB } from '@/utils/FileFunctions';
import { createServerSupabaseClient, SupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

interface DirInfo {
    dir: number | null,
    time: number
}

async function getSharedDirectories(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: DirInfo, searchStr: string) {
    if (searchStr.length > 0) {
        return await supabase
            .from('directories')
            .select('id, name, created_at, dir, dir!inner(shared, created_at), shared', { count: 'estimated' })
            .lt('dir.created_at', new Date(dir.time + 1).toISOString())
            .gt('dir.created_at', new Date(dir.time).toISOString())
            .eq('dir', dir.dir)
            .eq('dir.shared', true)
            .eq('shared', true)
            .like('name', `%${searchStr}%`)
            .range(from, to)
    } else {
        return await supabase
            .from('directories')
            .select('id, name, created_at, dir, dir!inner(shared, created_at), shared', { count: 'estimated' })
            .lt('dir.created_at', new Date(dir.time + 1).toISOString())
            .gt('dir.created_at', new Date(dir.time).toISOString())
            .eq('dir', dir.dir)
            .eq('dir.shared', true)
            .eq('shared', true)
            .range(from, to)
    }
}

async function getSharedFiles(supabase: SupabaseClient<any, "public", any>, from: number, to: number, dir: DirInfo, searchStr: string) {
    if (searchStr.length > 0) {
        return await supabase
            .from('files')
            .select('id, name, created_at, size, chanid, fileid, dir, dir!inner(shared, created_at)')
            .lt('dir.created_at', new Date(dir.time + 1).toISOString())
            .gt('dir.created_at', new Date(dir.time).toISOString())
            .eq('dir', dir.dir)
            .eq('dir.shared', true)
            .like('name', `%${searchStr}%`)
            .range(from, to)
    } else {
        const rs = await supabase
            .from('files')
            .select('id, name, created_at, size, chanid, fileid, dir, dir!inner(shared, created_at)')
            .lt('dir.created_at', new Date(dir.time + 1).toISOString())
            .gt('dir.created_at', new Date(dir.time).toISOString())
            .eq('dir', dir.dir)
            .eq('dir.shared', true)
            .range(from, to)
        return rs;
    }
}

async function getSharedFilesWithDir(supabase: SupabaseClient<any, "public", any>, dir: DirInfo, page: number, pageSize: number = 50, prevFiles: (DirFile | Directory)[], searchStr: string, isGlobal: boolean) {
    const prevDirsCount = prevFiles.filter(w => 'fileid' in w ? false : true).length;
    let from = (page - 1) * pageSize;
    let to = page * pageSize;
    return await fetchFilesFromDB(supabase, from, to, dir, prevDirsCount, pageSize, getSharedDirectories, getSharedFiles, searchStr, isGlobal);
}

type Data = {
    error?: string | undefined,
    arr?: (DirFile | Directory)[],
    next?: boolean,
    name?: string
    lastFew?: string,
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') return res.status(405).json({ error: `Method not allowed` });
    const { dirid, time, searchStr, page, pageSize, prevFiles } = JSON.parse(req.body);
    if (isNaN(dirid))
        return res.status(400).json({ error: `dirid must be a whole number` });
    if (isNaN(page))
        return res.status(400).json({ error: `page must be a whole number` });
    if (isNaN(pageSize))
        return res.status(400).json({ error: `pageSize must be a whole number` });
    if (isNaN(time))
        return res.status(400).json({ error: `time must be a whole number` });
    const supabase = createServerSupabaseClient({ req, res }, { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey: process.env.SUPABASE_SERVICE_KEY });
    try {
        //@ts-ignore
        const lastFew = `${supabase.supabaseKey.at(-4)}${supabase.supabaseKey.at(-3)}${supabase.supabaseKey.at(-2)}${supabase.supabaseKey.at(-1)}`
        const { data } = await supabase
            .from("directories")
            .select("id, name, shared, created_at")
            .lt('created_at', new Date(time + 1).toISOString())
            .gt('created_at', new Date(time).toISOString())
            .eq('id', dirid)
            .eq('shared', true).single();
        if (data) {
            const rs = await getSharedFilesWithDir(supabase, { dir: dirid, time }, page, pageSize, prevFiles, searchStr, false);
            return res.status(200).json({ ...rs, name: data.name })
        } else {
            console.log(data);
            return res.status(404).json({ error: "A hit and a miss", lastFew });
        }

    } catch (err: any) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
}