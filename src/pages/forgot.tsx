import { FormEvent, useState } from "react";
import styles from "@/styles/Register.module.css";
import { useRouter } from "next/router";
import Head from "next/head";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";

export default function ForgotPage() {
    const [email, setEmail] = useState<string>("");
    const [errors, setErrors] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = useSupabaseClient();
    async function reset(e: FormEvent) {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            setErrors(error.message);
        } else {
            setErrors('Email with recovery link has been sent!');
        }
        setIsLoading(false);
    }

    return (
        <div className={`${styles.background} pt-9 text-quaternary`}>
            <Head>
                <title>Forgot</title>
                <meta key="desc" property="og:description" content="Forgot password? reset it!" />
            </Head>
            <div className={styles.formplace}>
                <div className={styles.header}>
                    <h2 className="text-2xl">Forgot password?</h2>
                </div>
                <form className={styles.form} onSubmit={reset}>
                    <input className={styles['form-input']} placeholder="Email" onChange={w => setEmail(w.target.value)} type="email" name="email" />
                    <button disabled={isLoading} className={styles.button}>Reset</button>
                </form>
                <p className={`text-center hover:text-tertiary transition-colors ${styles.forgot}`}><Link href="/login">Found your password?</Link></p>
                <p className="mt-2 text-tertiary text-center">{errors}</p>
            </div>
        </div>
    )
}