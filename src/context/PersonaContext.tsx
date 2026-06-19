"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Persona } from "@/types/persona";
import { PERSONAS } from "@/data/personas";

interface Ctx {
  persona: Persona;
  setPersonaId: (id: Persona["id"]) => void;
  allPersonas: readonly Persona[];
}

const PersonaCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "forher.persona";
const isValidId = (v: string | null): v is Persona["id"] => !!v && PERSONAS.some((p) => p.id === v);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<Persona["id"]>("aanya"); // default lands on a PCOS persona

  // Persist + deep-link the selected persona so it survives navigation (e.g. into
  // the static /forher side and back) and supports ?persona=<id> links.
  useEffect(() => {
    try {
      const url = new URLSearchParams(window.location.search).get("persona");
      const stored = localStorage.getItem(STORAGE_KEY);
      const initial = isValidId(url) ? url : isValidId(stored) ? stored : null;
      if (initial) setId(initial);
    } catch {}
  }, []);

  const setPersonaId = (pid: Persona["id"]) => {
    setId(pid);
    try { localStorage.setItem(STORAGE_KEY, pid); } catch {}
  };

  const persona = useMemo(() => PERSONAS.find((p) => p.id === id) ?? PERSONAS[0], [id]);
  return (
    <PersonaCtx.Provider value={{ persona, setPersonaId, allPersonas: PERSONAS }}>
      {children}
    </PersonaCtx.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaCtx);
  if (!ctx) throw new Error("usePersona must be used within PersonaProvider");
  return ctx;
}
