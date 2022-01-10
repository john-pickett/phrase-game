export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { Guess } from "../../data/Guess";

export const createNewGuessRecord = async (record: any): Promise<Guess> => {
  const id = uuidv4();
  const { player, game, phrase, guess } = record;
  const text = `INSERT INTO player_game_guesses (id, player, game, phrase, guess)
    VALUES($1, $2, $3, $4, $5) RETURNING *;`;
  const values = [id, player, game, phrase, guess];

  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}