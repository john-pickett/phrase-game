export interface Guess {
  id: string;
  player: string;
  game: string;
  phrase: string;
  guess: string;
  matches?: string[];
}