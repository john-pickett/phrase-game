export interface Score {
  id: string;
  player: string;
  total_score?: number; // cumulative total
  points: number; // points on this guess
  guess: string;
}