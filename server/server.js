const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const wsServer = require("socket.io")(httpServer);

// http서버
httpServer.listen(process.env.PORT || 4000, () => console.log("Listening on port", process.env.PORT || 4000));

const findParticipantWithNickName = (roomName, nickName) => {
  for (const socketId of wsServer.sockets.adapter.rooms.get(roomName)) {
    const participant = wsServer.sockets.sockets.get(socketId);
    if (participant["nickName"] === nickName) {
      return true;
    }
  }
}

const countRoomParticipant = (roomName) => {
  const count = wsServer.sockets.adapter.rooms.get(roomName)?.size;
  if (count === 1) {
    return {count, player: "player-1"};
  }
  if (count === 2) {
    if (findParticipantWithNickName(roomName, "player-2")) {
      return {count, player: "player-1"};
    }
    return {count, player: "player-2"};
  }
  return {count, player: "null"};;
}

// 웹소켓
wsServer.on("connection", (socket) => {
  // 이벤트 감지
  socket.onAny((ev) => {
    console.log(ev)
  });

  // 방 입장, 퇴장
  socket.on("enterRoom", (roomName, goToRoom) => {
    socket.join(roomName);
    const { count, player } = countRoomParticipant(roomName);
    if (count === 1) {
      wsServer.sockets.adapter.rooms.get(roomName)["readyArr"] = [];
    }
    socket["nickName"] = player;
    if (count > 2) {
      goToRoom(false);
    } else {
      goToRoom(true);
    }
  });
  socket.on("leave-or-initialize-room", (get, goToHome) => {
    if (wsServer.sockets.adapter.rooms.get(get.roomName)?.size > 0) {
      if (wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"]) {
        wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"] = [];
      }
    }
    if (get.state === "leave") {
      wsServer.in(get.roomName).emit("initialize-ready");
      socket["nickName"] = null;
      socket.leave(get.roomName);
      if (goToHome) {
        goToHome("/");
      }
    };
    if (get.state === "initialize") {
      socket.to(get.roomName).emit("rematch-start", "Opponent Want Rematch!");
    }
  });

  socket.on("initialize-ready", roomName => {
    wsServer.sockets.adapter.rooms.get(roomName)["readyArr"] = [];
  })
  socket.on("send_msg", (get) => {
    socket.to(get.roomName).emit("get_msg", get.sendChat);
  });

  socket.on("board-setting", (roomName, setBoard) => {
    setBoard(socket["nickName"]);
    socket.to(roomName).emit("opponent-entered");
  });

  socket.on("request-move", (get, chessMove) => {
    chessMove(get.targetIndex);
    socket.to(get.roomName).emit("perform-chessMove", get.targetIndex);
  });

  socket.on("block-pick", (get, setIsBlockPick) => {
    setIsBlockPick(get.pickedIndex);
    socket.to(get.roomName).emit("picked-index", get.pickedIndex);
  });

  socket.on("send_getReady", (get, setImReady) => {
    if (get.isReady) {
      wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"].push(get.isReady);
    } else {
      wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"].pop();
    }
    setImReady();

    if (wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"].length === 2) {
      console.log(`room: ${get.roomName}. is ready to start.`)
      wsServer.in(get.roomName).emit("all-ready", "start!");
    };
  });
});
