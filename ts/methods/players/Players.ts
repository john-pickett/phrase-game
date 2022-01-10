export {}
const { v4: uuidv4 } = require('uuid');
const db = require('../../db/index');
import { addPlayerToGame } from "../games/Games";
import { Player } from "../../data/Player";
import { Game } from "../../data/Game";

export const createNewPlayerRecord = async (name: string): Promise<Player> => {
  const id = uuidv4();
  const text = `INSERT INTO players(id, name) VALUES($1, $2) RETURNING *`;
  const values = [id, name];
  try {
    const record = await db.query(text, values);
    // console.log('create new player ', record.rows[0]);
    
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const addPlayerToGameMain = async (short_code: string, player: string): Promise<Game> => {
  // create new player record, get id
  // find game, add player to players
  // return game data
  try {
    const newPlayer = await createNewPlayerRecord(player);
    const game = await addPlayerToGame(short_code, newPlayer.id);
    game.playerID = newPlayer.id;
    return game;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const getGamePlayers = async (short_code: string): Promise<Player[]> => {
  const text = `SELECT players FROM games WHERE games.short_code = $1`;
  const values = [short_code];

  try {
    const playerData = await db.query(text, values);
    const players = playerData.rows[0].players;
    // console.log(players);
    
    const playerText = `SELECT * FROM players WHERE players.id = ANY($1::uuid[])`;
    const playerValue = [players];
    const playerInfo = await db.query(playerText, playerValue);
    return playerInfo.rows;
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

// `SELECT * FROM players p WHERE p.id = ANY($1::uuid[])` 

export const updatePlayerReady = async (playerID: string) => {
  const text = `UPDATE players SET ready = true WHERE id = $1 RETURNING *;`;
  const values = [playerID]
  try {
    const record = await db.query(text, values);
    return record.rows[0];
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}

export const checkIfAllPlayersAreReady = async (short_code: string): Promise<boolean> => {
  // find players by game getGamePlayers
  try {
    const players = await getGamePlayers(short_code);
    return !players.some((player: Player) => !player.ready);
  } catch (err: any) {
    console.log(err);
		throw new Error(err);
  }
}