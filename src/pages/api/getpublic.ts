// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Directory, PageItems, getItems } from '@/utils/FileFunctions';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next'

export type GetPublicRes = {
    error?: string,
    items?: PageItems,
    currDir?: Directory
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_KEY as string);
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetPublicRes>
) {
    if (req.method !== 'GET') return res.status(405).json({ error: `Method not allowed` });
    //let { dirId, time, searchStr, page, pageSize } = req.query;
    try {
        const direc = parseInt(req.query.direc as string);
        if (isNaN(direc))
            return res.status(400).json({ error: `direc must be a whole number` });
        const from = parseInt(req.query.from as string);
        if (isNaN(from))
            return res.status(400).json({ error: `from must be a whole number` });
        const to = parseInt(req.query.to as string);
        if (isNaN(to))
            return res.status(400).json({ error: `to must be a whole number` });
        const time = parseInt(req.query.time as string);
        if (isNaN(time))
            return res.status(400).json({ error: `time must be a whole number` });
        const search_str = req.query.search_str ? req.query.search_str as string : '';
        const order_column: 'name' | 'id' | 'size' = req.query.order_column ? req.query.order_column as any : 'name';
        if (!['name', 'id', 'size'].includes(order_column)) {
            return res.status(400).json({ error: `order_column must one of specified: name, id or size.` });
        }
        const order_dir: 'asc' | 'desc' = req.query.order_dir ? req.query.order_dir as any : 'asc';
        if (!['asc', 'desc'].includes(order_dir)) {
            return res.status(400).json({ error: `order_dir must one of specified: asc or desc.` });
        }
        const { data } = await supabase
            .from("directories")
            .select("id, name, shared, created_at")
            .lt('created_at', new Date(time + 1).toISOString())
            .gt('created_at', new Date(time).toISOString())
            .eq('id', direc)
            .eq('shared', true).single();
        if (!data) {
            return res.status(500).json({ error: `Directory is unavailable` });
        }
        const pageItems = await getItems(supabase, direc, search_str, false, from, to, order_column, order_dir)

        if (pageItems.error) {
            return res.status(500).json({ error: pageItems.error });
        } else {
            return res.status(200).json({ items: pageItems, currDir: { ...data, dir: null } });
        }
    } catch (err: any) {
        console.log(err);
        return res.status(500).json({ error: `Failed: ${err.message ? err.message : ''}` })
    }
}
