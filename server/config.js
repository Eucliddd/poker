module.exports = {
  PORT: process.env.PORT || 3000,

  GAMES: {
    texas: {
      name: '德州扑克',
      minPlayers: 2,
      maxPlayers: 9,
      defaultChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
      turnTimeout: 30000,
      reconnectGrace: 60000,
    },
    doudizhu: {
      name: '斗地主',
      minPlayers: 3,
      maxPlayers: 3,
      turnTimeout: 30000,
      reconnectGrace: 60000,
    },
    guandan: {
      name: '掼蛋',
      minPlayers: 4,
      maxPlayers: 4,
      turnTimeout: 30000,
      reconnectGrace: 60000,
    },
  },

  ROOM_CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  ROOM_CODE_LENGTH: 4,
  ROOM_CLEANUP_INTERVAL: 5 * 60 * 1000,
  ROOM_STALE_TIMEOUT: 30 * 60 * 1000,
};
