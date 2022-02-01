export interface Score {
  id: string;
  player: string;
  game: string;
  phrase: string;
  total_score?: number; // cumulative total
  points: number; // points on this guess
  guess: string;
  order_count: number;
  match_count: number;
  winner?: boolean;
}