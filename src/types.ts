export type Emotion = 'Stress' | 'Sad' | 'Happy' | 'Neutral';

export interface AnalysisResult {
  id: string;
  timestamp: number;
  text: string;
  emotion: Emotion;
  feedback: string;
  suggestion: string;
}

export type Page = 'home' | 'analysis' | 'history' | 'dashboard';
export type TimeRange = 'all' | 'week' | 'month' | 'year';
