export interface AskSeed {
  prompt: string;
  reply: string;
  citation: string;
}

export const ASK_SEEDS: AskSeed[] = [
  {
    prompt: "Can I have biryani tonight?",
    reply:
      "Tough one. Biryani will spike your glucose fast — your HbA1c is 5.9% so we want to avoid that this week.\n\nIf you go for it: half plate + cucumber raita + 15 minutes of walking after. Skip the soft drink. Tomorrow we get back to a clean carbs day.",
    citation: "Based on your HbA1c 5.9% and your Week 3 plan",
  },
  {
    prompt: "Why am I tired after lunch?",
    reply:
      "Classic post-lunch crash — your blood sugar rises fast and dips. Your borderline BP (134 mmHg) doesn't help.\n\nTry: protein first (paneer/dal), then carbs, then a 10-min slow walk. Most people feel a clear difference within 4–5 days.",
    citation: "Based on your last 3 days of logs + your BP + HbA1c",
  },
  {
    prompt: "What's a good snack at 4pm?",
    reply:
      "Aim for protein + fibre, low sodium. Some options that fit your plan today:\n\n• A handful of roasted chana\n• Dahi with a few seeds\n• An apple with peanut butter (1 tbsp)\n\nSkip biscuits, namkeen, and packaged chips for now.",
    citation: "Based on your prediabetes + borderline BP",
  },
  {
    prompt: "Can I stop my BP medication?",
    reply:
      "That's a clinical decision — I'll route this to Dr Anjali Rao for your consult on Wed 28 May. I've added your question to the call notes.",
    citation: "Routed to your assigned doctor",
  },
];
