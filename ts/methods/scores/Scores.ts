export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { match } from "assert";
import { Guess } from "../../data/Guess";
import { Score } from "../../data/Score";

export const processPlayerGuessesAndScoreThem = async (guesses: Guess[]) => {
  const matchedGuesses = [];
  const scores = [];
  let totalScores = [];
  guesses.map((guess: any) => {
    guess.guess = guess.guess.trim().toLowerCase();
    return guess;
  })

  let counter = 1;
  while (counter <= 10) { // TODO: Set/find length of game
    // gets all guesses on the same phrase by order_count
    const currentGuesses = guesses.filter(guess => guess.order_count === counter); 
    matchedGuesses.push(determineMatchCountOnGuesses(currentGuesses));
    counter++;
  }

  for (let i = 0; i < matchedGuesses.length; i++) {
    for (let ii = 0; ii < matchedGuesses[i].length; ii++) {
      scores.push(scoreMatches(matchedGuesses[i][ii]));
    }
  }

  // Process scores and add up cumulative totalScore
  // @ts-ignore
  totalScores = checkPointsAndAddTotalScore(scores);
  const savedScores = [];
  for (let i = 0; i < totalScores.length; i++) {
    // @ts-ignore
    const savedRec = await createNewScoreRecord(totalScores[i]);
    savedScores.push(savedRec);
  }
  return savedScores;
}

const checkPointsAndAddTotalScore = (scores: Score[]): Score[] => {
 /*
  const scoreTally = {
    f1978094: 0,
    6b865028: 10
  }
 */

  const scoreTally: any = {};

  for (let i = 0; i < scores.length; i++) {
    // the playerTag assumes there won't be any exact matches in the first 8 uuid digits
    // pretty safe assumption but could be RF'ed later
    const playerTag = scores[i].player.split('-')[0]; 
    if (scoreTally[playerTag]) {
      scoreTally[playerTag] += scores[i].points;
      scores[i].total_score = scoreTally[playerTag];
    } else {
      scoreTally[playerTag] = scores[i].points;
      scores[i].total_score = scores[i].points;
    }
  }

  let highScore = 0;
  for (let score in scoreTally) {
    if (scoreTally[score] > highScore) {
      highScore = scoreTally[score]
    }
  }
  // console.log('high score: ', highScore);
  scores.filter(score => score.total_score == highScore).map(score => {
    score.winner = true;
    return score;
  })

  return scores;
}

/**
 * Checks if guesses match and adds match_count to each
 * @param guesses Guess[]
 * @returns guesses Guess[]
 */
const determineMatchCountOnGuesses = (guesses: Guess[]): Guess[] => {

  for (let i = 0; i < guesses.length; i++) {
    for (let ii = 0; ii < guesses.length; ii++) {
      if (i != ii) { // don't match the same guess to itself
        if (findMatch(guesses[i].guess, guesses[ii].guess)) {
          guesses[i].match_count += 1;
        }
      }
    }
  }

  return guesses;
}

/**
 * Actual logic for determining if two guesses match
 * @param guessA Guess
 * @param guessB Guess
 * @returns 
 */
const findMatch = (guessA: string, guessB: string): boolean => {
  return guessA === guessB;
}

/**
 * Adds points for each match
 * @param guess Guess
 * @returns guess Guess
 */
const scoreMatches = (guess: Guess) => {
  if (guess.match_count < 1) {
    guess.points = 0;
  } else if (guess.match_count == 1) {
    guess.points = 10;
  } else if (guess.match_count) {
    guess.points = 5;
  }
  return guess;
}

export const createNewScoreRecord = async (record: Score) => {
  const id = uuidv4();
  const { player, game, phrase, guess, order_count, match_count, points, total_score } = record;
  let { winner } = record;
  if (!winner) {
    winner = false;
  }
  const text = `INSERT INTO scores (id, player, game, phrase, points, total_score, 
    match_count, order_count, guess, winner) 
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;`;
  const values = [id, player, game, phrase, points, 
    total_score, match_count, order_count, guess, winner];

  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const getPlayerScoresFromGame = async (playerID: string, gameID: string) => {
  const text = `SELECT * FROM scores WHERE player = $1 AND game = $2;`;
  const values = [playerID, gameID];

  try {
    const records = await db.query(text, values);
    return records.rows;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const getAllScoresFromCompletedGame = async (gameID: string) => {
  const text = `SELECT s.id, s.points, s.total_score, s.order_count, 
    s.guess, s.winner, p.name as player, p.id as player_id, ph.phrase 
    FROM scores s
    JOIN players p ON s.player = p.id
    JOIN phrases ph ON s.phrase = ph.id
    WHERE s.game = $1`;
  const values = [gameID];

  try {
    const records = await db.query(text, values);
    return records.rows;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}