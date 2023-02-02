// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    data: any,
    error: string | undefined
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const { email, password } = req.body;
    const supabase = createServerSupabaseClient({ req, res }, { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY });
    const rs1 = await supabase.auth.signUp({ email, password })
    if (!rs1.error) {
        const rs = await supabase
            .from('userPlans')
            .insert({ plan: 1, userid: rs1?.data?.user?.id });
        if (rs.error) {
            return res.status(400).json({ error: rs.error.message, data: null });
        }
    }
    res.status(200).json({ error: rs1?.error?.message, data: rs1.data })
}
