import styles from '@/styles/CoolLoading.module.css';

export default function CoolLoader() {

    return (
        <div className={styles.wrapper}>
            <span className={`${styles.circle} ${styles['circle-1']}`}></span>
            <span className={`${styles.circle} ${styles['circle-2']}`}></span>
            <span className={`${styles.circle} ${styles['circle-3']}`}></span>
            <span className={`${styles.circle} ${styles['circle-4']}`}></span>
            <span className={`${styles.circle} ${styles['circle-5']}`}></span>
            <span className={`${styles.circle} ${styles['circle-6']}`}></span>
            <span className={`${styles.circle} ${styles['circle-7']}`}></span>
            <span className={`${styles.circle} ${styles['circle-8']}`}></span>
        </div>
    )
}