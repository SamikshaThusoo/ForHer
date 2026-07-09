import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Persona } from "@/types/persona";
import { PERSONAS } from "@/data/personas";
import { storage } from "@/lib/storage";

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

  // Persist the selected persona so it survives navigation. (The web build also read
  // a ?persona= deep link; there's no URL query on native, so storage is the source.)
  useEffect(() => {
    const stored = storage.getItem(STORAGE_KEY);
    if (isValidId(stored)) setId(stored);
  }, []);

  const setPersonaId = (pid: Persona["id"]) => {
    setId(pid);
    storage.setItem(STORAGE_KEY, pid);
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
