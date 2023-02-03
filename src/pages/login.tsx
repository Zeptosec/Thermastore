import { FormEvent, useState } from "react";
import styles from "@/styles/Register.module.css";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Head from "next/head";

export default function LoginPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errors, setErrors] = useState<string>("");
    const router = useRouter();
    const soup = useSupabaseClient();
    async function login(e: FormEvent) {
        e.preventDefault();
        const { error } = await soup.auth.signInWithPassword({
            email, password
        });
        if (error) {
            setErrors(error.message);
        } else {
            router.push("/");
            
        }
    }

    return (
        <div className={styles.background}>
            <Head>
                <title>Login</title>
            </Head>
            <div className={styles.formplace}>
                <div className={styles.header}>
                    <h2 className=" text-white text-2xl">Login</h2>
                </div>
                <form className={styles.form} onSubmit={login}>
                    <input className={styles['form-input']} placeholder="Email" onChange={w => setEmail(w.target.value)} type="email" name="email" />
                    <input className={styles['form-input']} placeholder="Password" onChange={w => setPassword(w.target.value)} type="password" name="password" />
                    <button className={styles.button}>Login</button>
                </form>
                <p className="mt-2 text-red-600 text-center">{errors}</p>
            </div>
        </div>
    )
}