import { FormEvent, useState } from "react";
import styles from "@/styles/Register.module.css";
import { useRouter } from "next/router";
import Head from "next/head";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import useFileManager from "@/context/FileManagerContext";

export default function LoginPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errors, setErrors] = useState<string>("");
    const router = useRouter();
    const fm = useFileManager();
    const supabase = useSupabaseClient();
    async function login(e: FormEvent) {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({
            email, password
        });
        if (error) {
            setErrors(error.message);
        } else {
            const { data } = await supabase
                .from('webhooks')
                .select('id, token')
                .single();
            if (data)
                await fm.setHook(data.id, data.token);
            router.push("/");

        }
    }

    return (
        <div className={`${styles.background} pt-9 text-quaternary`}>
            <Head>
                <title>Login</title>
                <meta key="desc" property="og:description" content="Login to view all your uploaded files!" />
            </Head>
            <div className={styles.formplace}>
                <div className={styles.header}>
                    <h2 className="text-2xl">Login</h2>
                </div>
                <form className={styles.form} onSubmit={login}>
                    <input className={styles['form-input']} placeholder="Email" onChange={w => setEmail(w.target.value)} type="email" name="email" />
                    <input className={styles['form-input']} placeholder="Password" onChange={w => setPassword(w.target.value)} type="password" name="password" />
                    <button className={styles.button}>Login</button>
                </form>
                <p className={`text-center hover:text-tertiary transition-colors ${styles.forgot}`}><Link href="/forgot">Forgot password?</Link></p>
                <p className="mt-2 text-red-600 text-center">{errors}</p>
            </div>
        </div>
    )
}