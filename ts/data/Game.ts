import { Player } from "./Player";
export interface Game {
  id: string;
  short_code: string;
  status: GameStatus
  owner: string;
  players: Player[];
  socket_id: string;
}

export enum GameStatus {
  OPEN = 'open',
  PLAYING = 'playing',
  CLOSED = 'closed'
}