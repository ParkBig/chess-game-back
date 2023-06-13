const express = require("express");
const http = require("http");
const cors = require("cors");
const socketHandler = require("./utils/socket").default;
const routes = require("./routes").default;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = http.createServer(app);
const wsServer = require("socket.io")(httpServer);

httpServer.listen(process.env.PORT || 4000, () =>
  console.log("Listening on port", process.env.PORT || 4000)
);

// http
app.get("/", routes.handleGetRequest);
app.post("/login", routes.handleLoginRequest);
app.post("/gameResult", routes.handleGameResult);

// socket.io
wsServer.on("connection", (socket) => {
  socketHandler(wsServer, socket);
});
