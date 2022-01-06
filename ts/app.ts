export {}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const db = require('./db');
const SSE = require('express-sse');
import { populateMasterPhrases } from "./methods/phrases/Phrases";
import { openNewGame, getGameAndPlayers } from "./methods/games/Games";
import { 
  createNewPlayerRecord, 
  getGamePlayers, 
  addPlayerToGameMain,
  updatePlayerReady,
  checkIfAllPlayersAreReady
} from "./methods/players/Players";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));

const port = process.env.PORT;

app.listen(port, () => { 
	console.log(`Server running at port: ${port}`);
});

// https://github.com/dpskvn/express-sse/issues/28
app.use(function (req: any, res: any, next: any) {
  res.flush = function () { /* Do nothing */ }
  next();
});

app.get('/', (req: any, res: any) => {
	res.send('Hello blank game');
});

/**
 * SERVER-SIDE EVENTS
 * https://github.com/dpskvn/express-sse
 */

export const playerSSE = new SSE();
app.get('/game-players/:short_code', playerSSE.init);

export const gameStartSSE = new SSE();
app.get('/game-start/:short_code', gameStartSSE.init);


app.post('/populate', async (req: any, res: any) => {
  try {
    const records = await populateMasterPhrases();
    res.send(records);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

/**
 * ACUTAL GAME ENDPOINTS
 */
app.post('/new-game', async (req: any, res: any) => {
  const { player } = req.body;
  try {
    const playerRec = await createNewPlayerRecord(player);
    const game = await openNewGame(playerRec);
    res.send(game);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.post('/join-game', async (req: any, res: any) => {
  const short_code = req.query.code;
  const { player } = req.body;
  // console.log(short_code);
  try {
    await addPlayerToGameMain(short_code, player);
    const game = await getGameAndPlayers(short_code);
    res.send(game);
    const players = await getGamePlayers(short_code)
    playerSSE.send(players); // sends current players to all players who have joined
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.get('/game/:short_code/players', async (req: any, res: any) => {
  // console.log(req.params.id);
  const { short_code } = req.params;
  
  try {
    const players = await getGamePlayers(short_code);
    res.send(players);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.put('/player-ready/:playerID/:short_code', async (req: any, res: any) => {
  console.log(req.params);
  // TODO: On ready, check if all players are ready, and if so start game
  const { playerID, short_code } = req.params;
  try {
    const result = await updatePlayerReady(playerID);
    const allReady = await checkIfAllPlayersAreReady(short_code);
    if (allReady) {
      console.log('all players are ready');
      playerSSE.send('game start');
    }
    res.send(result);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});