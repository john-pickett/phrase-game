export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { PlayerGameM2M } from "../../data/PlayerGame";

// TODO: Will use this M2M when I'm saving emails and player records 
// instead of creating new player records for each game
export const createNewPlayerGameM2MRecord = async (player: string, game: string): Promise<PlayerGameM2M> => {
  const id = uuidv4();
  const ready = false;
  const text = `INSERT INTO player_game_m2m(id, player, game, ready)
    VALUES($1, $2, $3, $4) RETURNING *;`;
  const values = [id, player, game, ready]

  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }

}