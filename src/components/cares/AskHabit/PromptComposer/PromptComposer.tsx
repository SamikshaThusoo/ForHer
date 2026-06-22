"use client";
import { useState, FormEvent } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./PromptComposer.module.css";

const SUGGESTIONS = [
  "Can I have biryani tonight?",
  "Why am I tired after lunch?",
  "What's a good snack at 4pm?",
  "Can I stop my BP medication?",
];

export function PromptComposer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s}
            type="button"
            className={styles.chip}
            onClick={() => onSend(s)}
            whileTap={{ scale: 0.96 }}
          >
            {s}
          </motion.button>
        ))}
      </div>
      <form onSubmit={submit} className={styles.form}>
        <input
          className={styles.input}
          placeholder="Ask anything about food, your labs, your plan…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <motion.button
          type="submit"
          className={styles.send}
          aria-label="Send"
          whileTap={{ scale: 0.94 }}
        >
          <Send size={18} strokeWidth={2} />
        </motion.button>
      </form>
    </div>
  );
}
