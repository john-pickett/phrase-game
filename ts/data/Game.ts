export interface Game {
  id: string;
  short_code: string;
  status: GameStatus
  owner: string;
}

export enum GameStatus {
  OPEN = 'open',
  PLAYING = 'playing',
  CLOSED = 'closed'
}