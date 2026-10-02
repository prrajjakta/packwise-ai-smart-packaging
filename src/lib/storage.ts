import type { AnalysisResult } from "./types";

const KEY = "packwise:last-analysis";
const HISTORY_KEY = "packwise:history";
const HISTORY_LIMIT = 50;

export interface HistoryEntry {
  id: string; // batchId
  name: string;
  savedAt: string;
  result: AnalysisResult;
}

export function saveAnalysis(result: AnalysisResult) {
  try {
    localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* storage unavailable */
  }
  addToHistory(result);
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

/* ----------------------------- history ----------------------------- */

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed.filter((e) => e?.result?.recommendations?.length) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  } catch {
    /* storage full or unavailable */
  }
}

function addToHistory(result: AnalysisResult) {
  const entries = loadHistory().filter((e) => e.id !== result.batchId);
  const date = new Date(result.createdAt).toLocaleDateString();
  entries.unshift({
    id: result.batchId,
    name: `${result.input.commodityName} · ${result.input.source} → ${result.input.destination} (${date})`,
    savedAt: new Date().toISOString(),
    result,
  });
  writeHistory(entries);
}

export function renameHistoryEntry(id: string, name: string) {
  writeHistory(loadHistory().map((e) => (e.id === id ? { ...e, name } : e)));
}

export function deleteHistoryEntry(id: string) {
  writeHistory(loadHistory().filter((e) => e.id !== id));
  const current = loadAnalysis();
  if (current?.batchId === id) clearAnalysis();
}

export function clearHistory() {
  writeHistory([]);
  clearAnalysis();
}

/** Make a saved entry the "current" analysis shown on /results. */
export function openHistoryEntry(id: string): boolean {
  const entry = loadHistory().find((e) => e.id === id);
  if (!entry) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(entry.result));
    return true;
  } catch {
    return false;
  }
}
