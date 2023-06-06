const { countRoomParticipant } = require('./countRoomParticipant');

const socketHandler = (wsServer, socket) => {
  socket.onAny((ev) => {
    console.log(ev)
  });

  socket.on("enterRoom", (roomName, goToRoom) => {
    socket.join(roomName);
    const { count, player } = countRoomParticipant(wsServer, roomName);
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
    }
    if (get.state === "initialize") {
      socket.to(get.roomName).emit("rematch-start", "Opponent Want Rematch!");
    }
  });

  socket.on("initialize-ready", (roomName) => {
    wsServer.sockets.adapter.rooms.get(roomName)["readyArr"] = [];
  });
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
      wsServer.sockets.adapter.rooms
        .get(get.roomName)
        ["readyArr"].push(get.isReady);
    } else {
      wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"].pop();
    }
    setImReady();

    if (
      wsServer.sockets.adapter.rooms.get(get.roomName)["readyArr"].length === 2
    ) {
      console.log(`room: ${get.roomName}. is ready to start.`);
      wsServer.in(get.roomName).emit("all-ready", "start!");
    }
  });
};

export default socketHandler;
