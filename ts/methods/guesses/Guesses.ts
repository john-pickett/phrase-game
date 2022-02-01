export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { Guess } from "../../data/Guess";
// import { createNewPlayerGameM2MRecord } from "../player-game/PlayerGame";

/**
 * Processes/saves Guesses for Player
 * @param guessData guesses from client
 * @returns 
 */
export const processPlayerGameGuesses = async (guessData: any): Promise<Guess[]> => {
  // { player, game, guesses }

  const records = [];
  try {
    for (let i = 0; i < guessData.guesses.length; i++) {
      const curRec = {
        player: guessData.player,
        game: guessData.game,
        phrase: guessData.guesses[i].phrase_id,
        guess: guessData.guesses[i].guess,
        order_count: guessData.guesses[i].order_count
      }
      const savedRec = await createNewGuessRecord(curRec);
      records.push(savedRec);
    }
    return records;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const createNewGuessRecord = async (record: Partial<Guess>): Promise<Guess> => {
  // console.log('new ', record);
  
  const id = uuidv4();
  const { player, game, phrase, guess, order_count } = record;
  const text = `INSERT INTO player_game_guesses (id, player, game, phrase, guess, order_count)
    VALUES($1, $2, $3, $4, $5, $6) RETURNING *;`;
  const values = [id, player, game, phrase, guess, order_count];

  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const checkIfAllPlayerGuessesAreIn = async (gameID: string): Promise<boolean> => {
  // Check if all players are marked as waiting
  // return boolean


  try {
    return false;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const grabAllGuessesFromGame = async (gameID: string): Promise<Guess[]> => {
  const text = `SELECT * FROM player_game_guesses WHERE game = $1`;
  const values = [gameID];

  try {
    const records = await db.query(text, values);
    return records.rows;
  } catch (err: any) {
    console.log(err);
    throw new Error(err);
  }
}