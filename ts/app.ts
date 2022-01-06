export {}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const db = require('./db');
import { populateMasterPhrases } from "./methods/phrases/Phrases";
import { openNewGame } from "./methods/games/Games";
import { createNewPlayerRecord } from "./methods/players/Players";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));

const port = process.env.PORT;

app.listen(port, () => { 
	console.log(`Server running at port: ${port}`);
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

app.post('/new-game', async (req: any, res: any) => {
  const { player } = req.body;
  try {
    const owner = await createNewPlayerRecord(player);
    const game = await openNewGame(owner);
    res.send(game);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});

app.post('/join-game', async (req: any, res: any) => {
  const short_code = req.query.code;
  console.log(short_code);
  try {
    res.send(short_code);
  } catch (err: any) {
    res.status(err.code ? err.code : 400).send(err.toString());
  }
});