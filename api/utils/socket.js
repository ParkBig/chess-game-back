const { countRoomParticipant } = require('./countRoomParticipant');

const socketHandler = (wsServer, socket) => {
  socket.onAny(ev => {
    console.log(ev);
  });

  socket.on('enterRoom', (get, goToRoom) => {
    socket.join(get.roomName);
    const { count, player } = countRoomParticipant(wsServer, get.roomName);
    if (count === 1) {
      wsServer.sockets.adapter.rooms.get(get.roomName)['readyArr'] = [];
      wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo'] = {
        'player-1': null,
        'player-2': null,
      };
    }
    socket['nickName'] = player;
    if (get.loginInfo) {
      wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo'][player] = get.loginInfo;
    }
    if (count > 2) {
      goToRoom(false);
    } else {
      goToRoom(true);
    }
    wsServer.in(get.roomName).emit('getLoginInfo', wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo']);
  });

  socket.on('when-reload-page', (get, goToHome) => {
    wsServer.in(get.roomName).emit('initialize-ready');
    if (wsServer.sockets.adapter.rooms.get(get.roomName)) {
      for (const socketId of wsServer.sockets.adapter.rooms.get(get.roomName)) {
        const participant = wsServer.sockets.sockets.get(socketId);
        if (participant['nickName'] === 'player-2') {
          wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo']['player-1'] = null;
        } else {
          wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo']['player-2'] = null;
        }
      }
      wsServer.in(get.roomName).emit('getLoginInfo', wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo']);
    }
    goToHome('/');
  });

  socket.on('leave-or-initialize-room', (get, goToHome) => {
    if (wsServer.sockets.adapter.rooms.get(get.roomName)?.size > 0) {
      if (wsServer.sockets.adapter.rooms.get(get.roomName)['readyArr']) {
        wsServer.sockets.adapter.rooms.get(get.roomName)['readyArr'] = [];
      }
    }
    if (get.state === 'leave') {
      wsServer.in(get.roomName).emit('initialize-ready');
      wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo'][socket['nickName']] = null;
      socket['nickName'] = null;
      wsServer.in(get.roomName).emit('getLoginInfo', wsServer.sockets.adapter.rooms.get(get.roomName)['loginInfo']);
      socket.leave(get.roomName);
      if (goToHome) {
        goToHome('/');
      }
    }
    if (get.state === 'initialize') {
      socket.to(get.roomName).emit('rematch-start', 'Opponent Want Rematch!');
    }
  });

  socket.on('initialize-ready', roomName => {
    wsServer.sockets.adapter.rooms.get(roomName)['readyArr'] = [];
  });
  socket.on('send_msg', get => {
    socket.to(get.roomName).emit('get_msg', get.sendChat);
  });

  socket.on('board-setting', (roomName, setBoard) => {
    setBoard(socket['nickName']);
    socket.to(roomName).emit('opponent-entered');
  });

  socket.on('request-move', (get, chessMove) => {
    chessMove(get.targetIndex);
    socket.to(get.roomName).emit('perform-chessMove', get.targetIndex);
  });

  socket.on('block-pick', (get, setIsBlockPick) => {
    setIsBlockPick(get.pickedIndex);
    socket.to(get.roomName).emit('picked-index', get.pickedIndex);
  });

  socket.on('send_getReady', (get, setImReady) => {
    if (get.isReady) {
      wsServer.sockets.adapter.rooms.get(get.roomName)['readyArr'].push(get.isReady);
    } else {
      wsServer.sockets.adapter.rooms.get(get.roomName)['readyArr'].pop();
    }
    setImReady();

    if (wsServer.sockets.adapter.rooms.get(get.roomName)['readyArr'].length === 2) {
      console.log(`room: ${get.roomName}. is ready to start.`);
      wsServer.in(get.roomName).emit('all-ready', 'start!');
    }
  });
};

module.exports = {
  socketHandler,
};
