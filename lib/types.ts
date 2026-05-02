export type PersonaId = 'friendly' | 'skeptical-retiree' | 'busy' | 'comparison' | 'hostile';

export interface Persona {
  id: PersonaId;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  personality: string;
  greeting: string;
  color: string;
  emoji: string;
}

export interface TranscriptEntry {
  role: 'user' | 'homeowner';
  text: string;
  timestamp: number;
}

export interface ScoreAxis {
  name: string;
  score: number;
  weight: number; // 1 = standard, 2 = priority
  feedback: string;
}

export interface Scorecard {
  sessionId: string;
  personaId: PersonaId;
  personaName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  date: number;
  durationSeconds: number;
  axes: ScoreAxis[];
  overallScore: number;
  summaryFeedback: string;
  transcript: TranscriptEntry[];
  didSign: boolean;
}

export interface SessionSummary {
  sessionId: string;
  personaId: PersonaId;
  personaName: string;
  date: number;
  overallScore: number;
  durationSeconds: number;
}
