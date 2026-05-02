import { Scorecard, SessionSummary } from './types';

const STORAGE_KEY = 'hvac_sessions';
const MAX_SESSIONS = 10;

export function saveScorecardToStorage(scorecard: Scorecard): void {
  try {
    const existing = getSessions();
    const updated = [scorecard, ...existing].slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function getSessions(): Scorecard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Scorecard[];
  } catch {
    return [];
  }
}

export function getSessionSummaries(): SessionSummary[] {
  return getSessions().map((s) => ({
    sessionId: s.sessionId,
    personaId: s.personaId,
    personaName: s.personaName,
    date: s.date,
    overallScore: s.overallScore,
    durationSeconds: s.durationSeconds,
  }));
}

export function getSessionById(id: string): Scorecard | undefined {
  return getSessions().find((s) => s.sessionId === id);
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
