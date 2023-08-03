import CoolButton from "@/components/CoolButton";
import CoolLoading2 from "@/components/CoolLoading2";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SetPasswordPage() {
    const [pass, setPass] = useState('');
    const [passr, setPassr] = useState('');
    const [updating, setUpdating] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [error, setError] = useState<{ msg: string | null, desc: string | null } | undefined>();

    useEffect(() => {
        const fpath = router.asPath.replace('#', '&');
        const params = new URLSearchParams(fpath);
        const error = params.get('error');
        const error_desc = params.get('error_description');
        setError({ msg: error, desc: error_desc })
        if (!supabase) {
            router.push('/404');
        }
    }, [])

    async function setPassword() {
        if (updating || !supabase) return;
        setUpdating(true);
        let errs: string[] = [];
        if (pass !== passr) {
            errs.push("Paswords do not match!");
        }
        if (pass.length < 8) {
            errs.push("Password is too short! 8 characters min!");
        }
        setErrors(errs);
        if (errs.length === 0) {
            try {
                const { error } = await supabase.auth.updateUser({ password: pass });
                if (error) {
                    setErrors(w => [...w, error.message]);
                } else {
                    setErrors(['Password has been changed!']);
                }
            } catch (err: any) {
                console.log(err);
                setErrors(w => [...w, err.message]);
            }
        }
        setUpdating(false);
    }

    return (
        <div className="pt-[100px] text-quaternary max-w-[1000px] px-4 m-auto grid justify-center gap-2">
            <Head>
                <title>{error && error.msg ? error.msg : 'Invitation'}</title>
            </Head>
            {error ? error.desc ? <>
                <p className="text-center text-4xl pb-8">{error.desc}</p>
            </> : <>
                <p className="text-center text-4xl pb-8">Set a new password</p>
                <div className="grid justify-self-stretch">
                    <p className="text-lg text-center">Password</p>
                    <input onChange={w => setPass(w.target.value)} value={pass} className="min-w-full p-2 bg-primary focus:outline-none focus:border focus:border-tertiary rounded-lg" type="password" name="pass" id="pass" />
                </div>
                <div className="grid justify-self-stretch">
                    <p className="text-lg text-center">Repeat password</p>
                    <input onChange={w => setPassr(w.target.value)} value={passr} className="p-2 bg-primary focus:outline-none focus:border focus:border-tertiary rounded-lg" type="password" name="passr" id="passr" />
                </div>
                {!updating && errors.length > 0 ? <div>
                    {errors.map((w, ind) => <p key={`err${ind}`} className="text-tertiary text-lg text-center">{w}</p>)}
                </div> : ''}
                <CoolButton onClick={setPassword}>Set</CoolButton>
            </> : <div className=" relative">
                <CoolLoading2 />
                <p className="pt-32 text-2xl text-center">Loading...</p>
            </div>}

        </div>
    )
}