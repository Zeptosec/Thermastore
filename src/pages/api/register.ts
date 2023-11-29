// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    error: string | undefined
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const { email, password } = req.body;
    const supabase = createServerSupabaseClient({ req, res }, { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey: process.env.SUPABASE_SERVICE_KEY });
    
	const rs1 = await supabase.auth.signUp({ email, password })
	if(rs1.error){
		console.error(rs1.error);
		return res.status(500).json({error: "Failed to sign up the user"});
	}
    res.status(200).json({});
}
