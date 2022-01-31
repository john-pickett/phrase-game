export interface Guess {
  id: string;
  player: string;
  game: string;
  phrase: string;
  guess: string;
  match_count: number;
  order_count: number;
  points?: number;
}