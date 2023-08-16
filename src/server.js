const express = require('express');
const http = require('http');
const cors = require('cors');
const { socketHandler } = require('./utils/socket');
const { handleGetRequest, handleLoginRequest, handleGameResult } = require('./routes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = http.createServer(app);
const wsServer = require('socket.io')(httpServer);

httpServer.listen(process.env.PORT || 4000, () => console.log('Listening on port', process.env.PORT || 4000));

// http
app.get('/', handleGetRequest);
app.post('/login', handleLoginRequest);
app.post('/gameResult', handleGameResult);

// socket.io
wsServer.on('connection', socket => {
  socketHandler(wsServer, socket);
});
