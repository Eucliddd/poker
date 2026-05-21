class GameSession {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.state = 'idle';      // idle -> dealing -> playing -> ended
    this.actionHistory = [];
  }

  start() {
    throw new Error('Subclass must implement start()');
  }

  handleAction(playerId, action, data) {
    throw new Error('Subclass must implement handleAction()');
  }

  getState(playerId) {
    throw new Error('Subclass must implement getState()');
  }

  getPublicState() {
    throw new Error('Subclass must implement getPublicState()');
  }

  getEndState() {
    throw new Error('Subclass must implement getEndState()');
  }

  onPlayerDisconnect(playerId) {
    // Override in subclass
  }
}

module.exports = GameSession;
