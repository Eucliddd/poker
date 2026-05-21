function registerRoomHandlers(io, socket, roomManager) {

  socket.on('room:create', ({ gameType, playerName }, callback) => {
    if (!playerName || playerName.trim().length === 0) {
      return callback({ error: '请输入昵称' });
    }
    if (playerName.trim().length > 12) {
      return callback({ error: '昵称最多12个字符' });
    }

    const result = roomManager.createRoom(gameType, socket.id, playerName.trim());
    if (result.error) {
      return callback({ error: result.error });
    }

    socket.join(result.room.code);
    callback({
      room: result.room.toJSON(),
      player: result.player.toJSON(),
    });
  });

  socket.on('room:join', ({ code, playerName }, callback) => {
    if (!playerName || playerName.trim().length === 0) {
      return callback({ error: '请输入昵称' });
    }
    if (!code || code.trim().length === 0) {
      return callback({ error: '请输入房间号' });
    }

    const result = roomManager.joinRoom(code.trim(), socket.id, playerName.trim());
    if (result.error) {
      return callback({ error: result.error });
    }

    socket.join(result.room.code);
    callback({
      room: result.room.toJSON(),
      player: result.player.toJSON(),
    });

    // Broadcast to others in room
    socket.to(result.room.code).emit('room:update', result.room.toJSON());
  });

  socket.on('room:leave', (_, callback) => {
    const result = roomManager.leaveRoom(socket.id);
    if (!result) {
      return callback && callback({ error: '不在任何房间中' });
    }

    socket.leave(result.room.code);
    if (callback) callback({ success: true });

    if (result.room) {
      io.to(result.room.code).emit('room:update', result.room.toJSON());
    }
  });

  socket.on('room:list', ({ gameType } = {}, callback) => {
    const rooms = roomManager.listRooms(gameType || null);
    if (callback) callback({ rooms });
  });

  socket.on('room:ready', ({ ready }, callback) => {
    const room = roomManager.getRoomByPlayer(roomManager.socketPlayer.get(socket.id));
    if (!room) {
      return callback && callback({ error: '不在房间中' });
    }

    const player = room.getPlayerBySocket(socket.id);
    if (!player) {
      return callback && callback({ error: '玩家不在房间中' });
    }

    player.isReady = ready;
    if (callback) callback({ success: true });
    io.to(room.code).emit('room:update', room.toJSON());
  });

  socket.on('room:updateSettings', (patches, callback) => {
    const playerId = roomManager.socketPlayer.get(socket.id);
    if (!playerId) return callback && callback({ error: '不在房间中' });

    const room = roomManager.getRoomByPlayer(playerId);
    if (!room) return callback && callback({ error: '房间不存在' });

    const result = room.updateSettings(playerId, patches);
    if (result.error) return callback && callback({ error: result.error });

    io.to(room.code).emit('room:update', room.toJSON());
    if (callback) callback({ success: true });
  });

  socket.on('game:rebuy', ({ amount }, callback) => {
    const playerId = roomManager.socketPlayer.get(socket.id);
    if (!playerId) return callback && callback({ error: '不在房间中' });

    const room = roomManager.getRoomByPlayer(playerId);
    if (!room || !room.gameSession) return callback && callback({ error: '游戏未开始' });

    const result = room.gameSession.rebuy(playerId, amount);
    if (result.error) return callback && callback({ error: result.error });

    // Broadcast updated state
    io.to(room.code).emit('game:turn', room.gameSession.getPublicState());
    for (const player of room.players) {
      const state = room.gameSession.getState(player.id);
      io.to(player.socketId).emit('game:dealt', state);
    }
    if (callback) callback({ success: true });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const result = roomManager.disconnectSocket(socket.id);
    if (result && result.room) {
      io.to(result.room.code).emit('room:update', result.room.toJSON());
      // Also notify game session
      if (result.room.gameSession) {
        result.room.gameSession.onPlayerDisconnect(result.playerId);
      }
    }
  });
}

module.exports = registerRoomHandlers;
