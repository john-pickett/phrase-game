export interface Player {
  id: string;
  name: string;
  status: PlayerStatus
}

export enum PlayerStatus {
  NEW = 'new',
  READY = 'ready',
  PLAYING = 'playing',
  WAITING = 'waiting',
  DONE = 'done'
}