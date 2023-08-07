import styles from '@/styles/CoolLoading2.module.css';

export default function CoolLoading2({ className }: { className?: string }) {

    return (
        <div className={`${styles.wrapper} ${className ? className : ''}`}>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.shadow}></div>
            <div className={styles.shadow}></div>
            <div className={styles.shadow}></div>
        </div>
    )
}