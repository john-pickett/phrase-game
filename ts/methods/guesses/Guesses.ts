export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { Guess } from "../../data/Guess";
import { createNewPlayerGameM2MRecord } from "../player-game/PlayerGame";

export const processPlayerGameGuesses = async (guessData: any) => {
  // { player, game, guesses }

  const records = [];
  try {
    for (let i = 0; i < guessData.guesses.length; i++) {
      const curRec = {
        player: guessData.player,
        game: guessData.game,
        phrase: guessData.guesses[i].phrase_id,
        guess: guessData.guesses[i].guess
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

export const checkIfAllPlayerGuessesAreIn = async (game: string): Promise<boolean> => {
  // game is game.id

  // Check if all players are marked as waiting
  // return boolean


  try {
    return false;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}