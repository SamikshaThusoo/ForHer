"use client";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";
import styles from "./ScannerViewport.module.css";

export function ScannerViewport({ scanning, onScan }: { scanning: boolean; onScan: () => void }) {
  return (
    <div className={styles.viewport}>
      <span className={`${styles.corner} ${styles.tl}`} />
      <span className={`${styles.corner} ${styles.tr}`} />
      <span className={`${styles.corner} ${styles.bl}`} />
      <span className={`${styles.corner} ${styles.br}`} />

      {scanning && (
        <motion.div
          className={styles.line}
          initial={{ top: "18%" }}
          animate={{ top: ["18%", "78%", "18%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className={styles.shutterStack}>
        <span className={styles.shutterIcon} aria-hidden>
          <ScanLine size={18} strokeWidth={1.8} />
        </span>
        <motion.button
          type="button"
          className={styles.shutter}
          onClick={onScan}
          disabled={scanning}
          whileTap={{ scale: 0.97 }}
        >
          {scanning ? "Scanning…" : "Tap to scan a packet"}
        </motion.button>
      </div>
    </div>
  );
}
