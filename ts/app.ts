export {}
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const express = require('express');
import { createServer } from "http";
import { Server } from "socket.io";
const db = require('./db');
import { 
  populateMasterPhrases, 
  getSetOfPhrasesForGame 
} from "./methods/phrases/Phrases";
import { openNewGame, getGameAndPlayers } from "./methods/games/Games";
import { 
  createNewPlayerRecord, 
  getGamePlayers, 
  addPlayerToGameMain,
  updatePlayerReady,
  checkIfAllPlayersAreReady
} from "./methods/players/Players";
import { createNewGuessRecord } from "./methods/guesses/Guesses";
// import { 
//   ServerToClientEvents, 
//   ClientToServerEvents, 
//   InterServerEvents, 
//   SocketData
// } from './data/Server';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { // Need to explicitly set CORS RULES
    origin: "http://localhost:8080",
  }
});


const port = process.env.PORT;

httpServer.listen(port, () => { 
	console.log(`Server running at port: ${port}`);
});

// const emitEvent = async (event: string, socketID: string, payload: {}) => {
//   console.log('emitting event ', payload);
//   io.to(socketID).emit(event, payload);
// }

io.on('connection', async (socket: any) => {
  console.log(`user id ${socket.id} connected`);
  const socket_id = socket.id;

  socket.join(socket_id); // joins to unique user socket
  io.to(socket_id).emit("connected", {
    action: "set_socket", // unique player socket
    id: socket.id
  });

  app.set("socket", socket);
  
});




app.get('/', (req: any, res: any) => {
	res.send('Hello blank game');
});

app.post('/populate', async (req: any, res: any) => {
  try {
    const records = await populateMasterPhrases();
    res.send(records);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

/**
 * ACTUAL GAME ENDPOINTS
 */
app.post('/new-game', async (req: any, res: any) => {
  const { player } = req.body;
  // console.log(req.body);

  
  try {
    const socket = req.app.get("socket");
    const playerRec = await createNewPlayerRecord(player);
    const game = await openNewGame(playerRec);
    game.playerID = playerRec.id;
    const short_code = game.short_code;
    if (socket) {
      // socket should always be defined when there is a client
      // this if () is only for postman
      socket.join(short_code); // joining game owner to game socket id (game.short_code)
    }
    
    res.send(game);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

  
app.post('/join-game', async (req: any, res: any) => {
  const short_code = req.query.code;
  const { player } = req.body;

  try {
    const socket = req.app.get("socket");
    const playerRec = await addPlayerToGameMain(short_code, player);
    const game = await getGameAndPlayers(short_code);
    game.playerID = playerRec.playerID;
    // join game room
    socket.join(short_code);
    io.to(short_code).emit("connected", { action: "new_player" });

    res.send(game);
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
  // console.log(req.params);

  const { playerID, short_code } = req.params;
  try {
    const result = await updatePlayerReady(playerID);
    io.to(short_code).emit("connected", { action: "update_players" });
    const allReady = await checkIfAllPlayersAreReady(short_code);
    if (allReady) {
      console.log('all players are ready');
      io.to(short_code).emit("connected", { action: "all_players_ready" });
    }
    res.send(result);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.get('/game-start/:short_code', async (req: any, res: any) => {
  const { short_code } = req.params;

  try {
    const phrases = await getSetOfPhrasesForGame();
    res.send(phrases);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.post('/guess/:game/:player/:phrase', async (req: any, res: any) => {
  const { game, player, phrase } = req.params;
  const { guess } = req.body; 
  const guessData = { player, game, phrase, guess };
  try { 
    const record = await createNewGuessRecord(guessData);
    return record;
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});