import styles from "@/styles/CoolButton.module.css";
export default function CoolButton({ children, onClick, disabled }: any) {
    return (
        <div className={styles.buttons}>
            <button onClick={onClick} className={styles['blob-btn']} disabled={disabled ? disabled : false}>
                {children}
                <span className={styles['blob-btn__inner']}>
                    <span className={styles['blob-btn__blobs']}>
                        <span className={styles["blob-btn__blob"]}></span>
                        <span className={styles["blob-btn__blob"]}></span>
                        <span className={styles["blob-btn__blob"]}></span>
                        <span className={styles["blob-btn__blob"]}></span>
                    </span>
                </span>
            </button>
            <br />

            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="h-0 w-0">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
                        <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
                    </filter>
                </defs>
            </svg>
        </div>
    )
}