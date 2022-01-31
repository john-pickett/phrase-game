export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
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
  totalScores = checkScoresAndAddTotalScore(scores);

  return totalScores;
}

const checkScoresAndAddTotalScore = (scores: Score[]): Score[] => {
 /*
  const scores = {
    f1978094: 0,
    6b865028: 10
  }
 */

  const scoreTally = {};

  for (let i = 0; i < scores.length; i++) {
    // console.log('score ', scoreTally);
    
    const playerTag = scores[i].player.split('-')[0];
    // @ts-ignore
    if (scoreTally[playerTag]) {
      // @ts-ignore
      scoreTally[playerTag] += scores[i].points;
      // @ts-ignore
      scores[i].total_score = scoreTally[playerTag];
    } else {
      // @ts-ignore
      scoreTally[playerTag] = scores[i].points;
      // @ts-ignore
      scores[i].total_score = scores[i].points;
    }
  }

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
const scoreMatches = (guess: Guess): Score => {
  if (guess.match_count < 1) {
    guess.points = 0;
  } else if (guess.match_count == 1) {
    guess.points = 10;
  } else if (guess.match_count) {
    guess.points = 5;
  }
  // @ts-ignore
  return guess;
}