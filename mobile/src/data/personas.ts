import { PMOS_PERSONAS } from "./pmosPersonas";

// PMOS-only program: the four PMOS personas are the complete persona set.
// (The earlier prediabetes/non-PMOS demo personas were removed — this product
//  focuses solely on the PMOS care journey.)
export const PERSONAS = [...PMOS_PERSONAS] as const;
