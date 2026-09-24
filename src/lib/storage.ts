import type { AnalysisResult } from "./types";

const KEY = "packwise:last-analysis";

export function saveAnalysis(result: AnalysisResult) {
  try {
    localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* storage unavailable */
  }
}

export function loadAnalysis(): AnalysisResult | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalysisResult;
    if (!parsed?.recommendations?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAnalysis() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
