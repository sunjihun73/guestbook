import { normalizeApiBase } from "./api-base";

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);
