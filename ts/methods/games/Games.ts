export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { Game, GameStatus } from "../../data/Game";
import { Player } from "../../data/Player";


export const openNewGame = async (owner: Player): Promise<Game> => {
  const id = uuidv4();
  const short_code = generateShortCode();
  const status = GameStatus.OPEN;
  const ownerID = owner.id;
  try {
    const game = createNewGameRecord(id, short_code, status, ownerID);
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
  const text = `INSERT INTO games (id, short_code, status, owner) VALUES($1, $2, $3, $4) RETURNING *`;
  const values = [id, short_code, status, owner];

  // SELECT, FROM, JOIN, ON, WHERE
  try {
    const game = await db.query(text, values);
    const gameID = game.rows[0].id;
    const selectText = `SELECT g.id, g.short_code, g.status, g.created_at, p.name 
      FROM games g 
      JOIN players p 
      ON g.owner = p.id 
      WHERE g.id = $1`;
    const selectValues = [gameID]
    const record = await db.query(selectText, selectValues)
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  } 
}