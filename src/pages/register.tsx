import { FormEvent, useState } from "react";
import styles from "@/styles/Register.module.css";

export default function registerPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [repeat, setRepeat] = useState<string>("");
    const [errors, setErrors] = useState<string>("");
    async function login(e: FormEvent) {
        e.preventDefault();
        if (password !== repeat) {
            setErrors("Passwords do not match");
        } else if (password.length < 8) {
            setErrors("Password length must be at least 8 characters");
        } else {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            })
            if (res.ok) {
                const { error, data } = await res.json();
                if (error) {
                    setErrors(error);
                } else {
                    setErrors("Email confirmation has been sent. Go check your inbox")
                }
            }
        }
    }

    return (
        <div className={styles.background}>
            <div className={styles.formplace}>
                <div className={styles.header}>
                    <h2 className=" text-white text-2xl">Register</h2>
                </div>
                <form className={styles.form} onSubmit={login}>
                    <input className={styles['form-input']} placeholder="Email" onChange={w => setEmail(w.target.value)} type="email" name="email" />
                    <input className={styles['form-input']} placeholder="Password" onChange={w => setPassword(w.target.value)} type="password" name="password" />
                    <input className={styles['form-input']} placeholder="Repeat password" onChange={w => setRepeat(w.target.value)} type="password" name="password" />
                    <button className={styles.button}>Register</button>
                </form>
                <p className="mt-2 text-red-600 text-center">{errors}</p>
            </div>
        </div>
    )
}