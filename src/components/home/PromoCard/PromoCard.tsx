"use client";
import styles from "./PromoCard.module.css";

/**
 * Dental benefits promo card shown to non-enrolled users (State A).
 * Includes a 4-dot carousel indicator below the card.
 */
export function PromoCard() {
  return (
    <>
      <div className={styles.promo}>
        <div>
          <h3 className={styles.title}>
            Dental care benefits
            <span>for you and your loved ones</span>
          </h3>
          <ul className={styles.bullets}>
            <li>10% off crowns, implants &amp; orthodontics</li>
            <li>Unlimited free consults &amp; X-rays</li>
            <li>1 OPG and 1 visit scaling</li>
          </ul>
          <button className={styles.btn}>Enroll Now</button>
        </div>
        <div className={styles.qr} aria-hidden />
      </div>
      <div className={styles.dots}>
        <i className={styles.on} />
        <i />
        <i />
        <i />
      </div>
    </>
  );
}
