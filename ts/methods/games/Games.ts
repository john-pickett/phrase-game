export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { getGamePlayers } from "../players/Players";
import { createNewPlayerGameM2MRecord } from "../player-game/PlayerGame";
import { Game, GameStatus } from "../../data/Game";
import { Player } from "../../data/Player";


export const openNewGame = async (player: Player): Promise<Game> => {
  const id = uuidv4();
  const short_code = generateShortCode();
  const status = GameStatus.OPEN;
  const playerID = player.id;
  try {
    const game = createNewGameRecord(id, short_code, status, playerID);
    return game;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

const generateShortCode = (): string => {
  // const chars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T',
  // 'U','V','W','X','Y','Z','1','2','3','4','5','6','7','8','9'];
  const chars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t',
  'u','v','w','x','y','z','1','2','3','4','5','6','7','8','9','0'];

  const short_code = [];
  while (short_code.length < 10) {
    const random = Math.floor(Math.random() * chars.length);
    short_code.push(chars[random]);
  }
  return short_code.join('');
}

const createNewGameRecord = async (id: string, short_code: string, status: GameStatus, owner: string): Promise<Game> => {
  // const players = [owner];
  const text = `INSERT INTO games (id, short_code, status, players) VALUES($1, $2, $3, $4) RETURNING *`;
  const values = [id, short_code, status, [owner]];

  // SELECT, FROM, JOIN, ON, WHERE
  try {
    const gameData = await db.query(text, values);
    const gameID = gameData.rows[0].id;
    // console.log(gameData.rows[0]);
    const game = gameData.rows[0];

    const playersText = `SELECT * FROM players p WHERE p.id = ANY($1::uuid[])` 
    const playersValues = [gameData.rows[0].players];
    const players = await db.query(playersText, playersValues);
    game.players = players.rows;

    return game;
    // return game.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  } 
}

export const addPlayerToGame = async (short_code: string, playerID: string): Promise<Game> => {
  // find game by short_code, add player to players
  const text = `UPDATE games SET players = array_append(players, $2::uuid) WHERE short_code = $1 RETURNING *`;
  const values = [short_code, playerID];

  try {
    const record = await db.query(text, values);
    // console.log(record.rows);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const getGameAndPlayers = async (short_code: string): Promise<Game> => {
  const text = `SELECT * FROM games WHERE short_code = $1`;
  const values = [short_code];

  try {
    const gameData = await db.query(text, values);
    const game = gameData.rows[0];
    game.players = await getGamePlayers(short_code);
    return game;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}