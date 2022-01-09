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

// TODO: What if we use the Game ShortCode as the socket_id for all players in that game?
io.on('connection', async (socket: any) => {
  console.log(`user id ${socket.id} connected`);
  const socket_id = socket.id;

  socket.join(socket_id); // joins to unique user socket
  io.to(socket_id).emit("connected", {
    action: "set_socket",
    id: socket.id
  });

  app.set("socket", socket);
  
});

io.on('onAny', (socket: any) => {
  console.log('on any ', socket);
  
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
    const playerRec = await createNewPlayerRecord(player);
    const game = await openNewGame(playerRec);
    const short_code = game.short_code;
    // TODO: Different channel for connection vs game events?
    emitEvent("connected", short_code, { action: "new_game" }); 
    
    res.send(game);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

// app.use('/api/taskRequest', taskRequest);



// const joinGame = async () => {
//   console.log('join game');
  
  app.post('/join-game', async (req: any, res: any) => {
    const short_code = req.query.code;
    const { player } = req.body;
  
    try {
      await addPlayerToGameMain(short_code, player);
      const game = await getGameAndPlayers(short_code);
      // TODO: Subscribe Player 2 to Game socket
      // Need to send to client, trigger API call after they join??
      const socket = req.app.get("socket");
      socket.join(short_code);
      
      emitEvent("connected", game.short_code, { action: "new_player" });
      res.send(game);
    } catch (err: any) {
      res.status(err.code ? err.code : 400).send(err.toString());
    }
  });

// }

// app.use('/join-game', joinGame)

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
      io.to(short_code).emit("all_players_ready");
    }
    res.send(result);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});