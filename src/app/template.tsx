"use client";
import { motion } from "framer-motion";

// Re-mounts on every route change, giving each screen a soft fade + slide in.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}
