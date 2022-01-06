export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { Player } from "../../data/Player";

export const createNewPlayerRecord = async (name: string): Promise<Player> => {
  const id = uuidv4();
  const text = `INSERT INTO players(id, name) VALUES($1, $2) RETURNING *`;
  const values = [id, name];
  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}