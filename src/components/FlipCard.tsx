import styles from '@/styles/FlipCard.module.css'

export default function FlipCard({ children, className }: any) {

    return (
        <div className={`${styles["flip-card"]} ${className ?? ""}`}>
            <div className={`${styles["flip-card-inner"]} group-hover:flip-y`}>
                <div className={styles["flip-card-front"]}>
                    {children[0]}
                </div>
                <div className={styles["flip-card-back"]}>
                    {children[1]}
                </div>
            </div>
        </div>
    )
}