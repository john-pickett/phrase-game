export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { Phrase } from '../../data/Phrase';
import masterPhrases from './MasterPhrases.json';

export const getRandomSetOfPhrasesForGame = async (): Promise<Phrase[]> => {
  const text = `SELECT * FROM phrases ORDER BY RANDOM() LIMIT 10;`;
  try {
    const records = await db.query(text, null);
    let counter = 1;
    records.rows.map((row: any) => {
      row.order_count = counter;
      counter++;
      return row;
    });
    
    return records.rows;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const getGamePhrases = async (short_code: string) => {
  // `SELECT * FROM players p WHERE p.id = ANY($1::uuid[])` 
  const text = `SELECT p.id, p.phrase FROM games g JOIN phrases p 
    ON p.id = ANY(phrases::uuid[])
    WHERE g.short_code = $1`;
  const values = [short_code];

  try {
    const records = await db.query(text, values);
    return records.rows;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const populateMasterPhrases = async (): Promise<Phrase[]> => {
  const records = [];
  try {
    for (let i = 0; i < masterPhrases.length; i++) {
      const curRec = await createPhraseRecord(masterPhrases[i]);
      records.push(curRec);
    }
    return records;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

const createPhraseRecord = async (phrase: string): Promise<Phrase> => {
  const id = uuidv4();
  const text = `INSERT INTO phrases (id, phrase) VALUES ($1, $2) RETURNING *`;
  const values = [id, phrase];
  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}