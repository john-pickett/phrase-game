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
import { populateMasterPhrases } from "./methods/phrases/Phrases";
import { openNewGame, getGameAndPlayers } from "./methods/games/Games";
import { 
  createNewPlayerRecord, 
  getGamePlayers, 
  addPlayerToGameMain,
  updatePlayerReady,
  checkIfAllPlayersAreReady
} from "./methods/players/Players";
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData
} from './data/Server';

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

const emitEvent = async (event: string, socketID: string, payload: {}) => {
  console.log('emitting event ', payload);
  io.to(socketID).emit(event, payload);
}

io.on('connection', async (socket: any) => {
  console.log('a user connected', socket.id);
  const socket_id = socket.id;

  socket.join(socket_id); // joins to unique user socket
  io.to(socket_id).emit("connected", {
    action: "set_socket",
    id: socket.id
  });
  
});

// io.on('game-id', async (socket: any) => {
//   console.log('game-id');
//   console.log(socket);
  
// })

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
  const { player, socket_id } = req.body;
  console.log(req.body);
  
  try {
    const playerRec = await createNewPlayerRecord(player);
    const game = await openNewGame(playerRec, socket_id);
    const short_code = game.short_code;
    emitEvent("connected", socket_id, { action: "new_game" });
    // io.to(socket_id).emit("connected", {
    //   action: 'new_game',
    //   code: short_code
    // });
    // socket.join(short_code);
    res.send(game);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.post('/join-game', async (req: any, res: any) => {
  const short_code = req.query.code;
  // console.log(req.query);
  
  const { player } = req.body;
  // console.log(short_code);
  try {
    await addPlayerToGameMain(short_code, player);
    const game = await getGameAndPlayers(short_code);
    // TODO: get socket_id from game?
    
    emitEvent("connected", game.socket_id, { action: "new_player" });
    // io.to(socket_id).emit("connected", {
    //   action: 'new_player',
    //   code: short_code
    // });
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
  console.log(req.params);

  const { playerID, short_code } = req.params;
  try {
    const result = await updatePlayerReady(playerID);
    const allReady = await checkIfAllPlayersAreReady(short_code);
    if (allReady) {
      console.log('all players are ready');
      io.to(short_code).emit("all-players-ready");
    }
    res.send(result);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});