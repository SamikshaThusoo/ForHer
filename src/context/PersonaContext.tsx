"use client";
import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Persona } from "@/types/persona";
import { PERSONAS } from "@/data/personas";

interface Ctx {
  persona: Persona;
  setPersonaId: (id: Persona["id"]) => void;
  allPersonas: readonly Persona[];
}

const PersonaCtx = createContext<Ctx | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<Persona["id"]>("priya"); // default to State B so the demo lands on the rich card
  const persona = useMemo(() => PERSONAS.find((p) => p.id === id) ?? PERSONAS[0], [id]);
  return (
    <PersonaCtx.Provider value={{ persona, setPersonaId: setId, allPersonas: PERSONAS }}>
      {children}
    </PersonaCtx.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaCtx);
  if (!ctx) throw new Error("usePersona must be used within PersonaProvider");
  return ctx;
}
