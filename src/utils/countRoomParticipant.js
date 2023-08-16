const findParticipantWithNickName = (wsServer, roomName, nickName) => {
  for (const socketId of wsServer.sockets.adapter.rooms.get(roomName)) {
    const participant = wsServer.sockets.sockets.get(socketId);
    if (participant['nickName'] === nickName) {
      return true;
    }
  }
};

const countRoomParticipant = (wsServer, roomName) => {
  const count = wsServer.sockets.adapter.rooms.get(roomName)?.size;
  if (count === 1) {
    return { count, player: 'player-1' };
  }
  if (count === 2) {
    if (findParticipantWithNickName(wsServer, roomName, 'player-2')) {
      return { count, player: 'player-1' };
    }
    return { count, player: 'player-2' };
  }
  return { count, player: 'null' };
};

module.exports = {
  countRoomParticipant,
};
