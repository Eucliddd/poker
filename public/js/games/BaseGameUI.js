const GameUIRegistry = (() => {
  const _uis = {};
  let _active = null;

  function register(gameType, uiClass) {
    _uis[gameType] = uiClass;
  }

  function get(gameType) {
    if (_active && _active.gameType === gameType) return _active;
    const UI = _uis[gameType];
    if (!UI) return null;
    if (_active) _active.destroy();
    _active = new UI();
    return _active;
  }

  return { register, get };
})();

class BaseGameUI {
  constructor(gameType) {
    this.gameType = gameType;
    this.container = document.getElementById('game-table');
    this.turnTimer = null;
    this.myPlayerId = null;
  }

  init() {
    this.container.innerHTML = '';
    const player = AppState.get('player');
    this.myPlayerId = player ? player.id : null;

    // Set room info
    const room = AppState.get('room');
    if (room) {
      document.getElementById('game-room-code').textContent = '房间: ' + room.code;
      const gameNames = { texas: '德州扑克', doudizhu: '斗地主', guandan: '掼蛋' };
      document.getElementById('game-type-label').textContent = gameNames[room.gameType] || room.gameType;
    }

    // Subscribe to state changes
    this.unsubGameState = AppState.on('playerGameState', (state) => {
      if (state) this.onPrivateState(state);
    });
    this.unsubPublicState = AppState.on('gamePublicState', (state) => {
      if (state) this.onPublicState(state);
    });
    this.unsubLastAction = AppState.on('lastAction', (action) => {
      if (action) this.onAction(action);
    });
    this.unsubGameResult = AppState.on('gameResult', (result) => {
      if (result) this.onGameEnd(result);
    });
    this.unsubRoom = AppState.on('room', (room) => {
      if (!room && document.getElementById('page-game').classList.contains('active')) {
        Router.navigate('lobby');
      }
    });

    document.getElementById('btn-game-leave').onclick = () => {
      SocketClient.emit('room:leave', {});
      AppState.set('room', null);
      Router.navigate('lobby');
    };

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      Sound.init();
      soundBtn.onclick = () => {
        Sound.enabled = !Sound.enabled;
        soundBtn.textContent = Sound.enabled ? '🔊' : '🔇';
      };
    }

    this.render();

    // Read already-received state (may have arrived before init)
    const existingPrivate = AppState.get('playerGameState');
    if (existingPrivate) this.onPrivateState(existingPrivate);
    const existingPublic = AppState.get('gamePublicState');
    if (existingPublic) this.onPublicState(existingPublic);
    const existingResult = AppState.get('gameResult');
    if (existingResult) this.onGameEnd(existingResult);

    // Start turn timer
    this.startTimer();
  }

  destroy() {
    if (this.unsubGameState) this.unsubGameState();
    if (this.unsubPublicState) this.unsubPublicState();
    if (this.unsubLastAction) this.unsubLastAction();
    if (this.unsubGameResult) this.unsubGameResult();
    if (this.unsubRoom) this.unsubRoom();
    if (this.turnTimer) clearInterval(this.turnTimer);
  }

  render() {}
  onPrivateState(state) {}
  onPublicState(state) {}
  onAction(action) {}
  onGameEnd(result) {}

  startTimer() {
    if (this.turnTimer) clearInterval(this.turnTimer);
    // Subclass can override
  }

  showMessage(text, duration = 2000) {
    const el = document.createElement('div');
    el.className = 'game-message';
    el.textContent = text;
    this.container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, duration);
  }
}

window.BaseGameUI = BaseGameUI;
