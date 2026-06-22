"use client";
import { useState } from "react";
import { ASK_SEEDS } from "@/data/askResponses";
import { ChatThread } from "@/components/cares/AskHabit/ChatThread/ChatThread";
import { MessageBubble } from "@/components/cares/AskHabit/MessageBubble/MessageBubble";
import { PromptComposer } from "@/components/cares/AskHabit/PromptComposer/PromptComposer";
import styles from "./ask.module.css";

interface Msg { role: "user" | "habit"; text: string; citation?: string; }

export default function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "habit", text: "Hi Priya. I'm Habit. Ask me anything about your meals, your plan, or your labs — I'll answer with your data in mind.", citation: "Grounded in your Smart Report" },
  ]);

  function handleSend(text: string) {
    setMessages((m) => [...m, { role: "user", text }]);
    const seed = ASK_SEEDS.find((s) => s.prompt.toLowerCase() === text.toLowerCase());
    setTimeout(() => {
      if (seed) {
        setMessages((m) => [...m, { role: "habit", text: seed.reply, citation: seed.citation }]);
      } else {
        setMessages((m) => [...m, {
          role: "habit",
          text: "I'll come back to you on this with a personalised answer based on your labs. (Prototype — extend ASK_SEEDS in data/askResponses.ts to wire more answers.)",
          citation: "Prototype response",
        }]);
      }
    }, 500);
  }

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Ask Habit</h2>
      <p className={styles.sub}>Grounded in your labs. Clinical questions route to your doctor.</p>
      <ChatThread>
        {messages.map((m, i) => <MessageBubble key={i} role={m.role} text={m.text} citation={m.citation} />)}
      </ChatThread>
      <PromptComposer onSend={handleSend} />
    </main>
  );
}
