const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(name, socketId) {
    this.id = uuidv4();
    this.name = name;
    this.socketId = socketId;
    this.seatIndex = -1;
    this.isReady = false;
    this.isOnline = true;
    this.joinedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      seatIndex: this.seatIndex,
      isReady: this.isReady,
      isOnline: this.isOnline,
    };
  }
}

module.exports = Player;
