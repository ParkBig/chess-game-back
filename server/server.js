const express = require("express");
const http = require("http");
const cors = require("cors");
const { handleGetRequest } = require('./routes');
const socketHandler = require('./utils/socket').default;
require("dotenv").config();

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const wsServer = require("socket.io")(httpServer);

// http서버
httpServer.listen(process.env.PORT || 4000, () => console.log("Listening on port", process.env.PORT || 4000));

// socket.io
wsServer.on("connection", (socket) => {
  socketHandler(wsServer, socket)
});
