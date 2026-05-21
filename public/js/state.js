const AppState = (() => {
  const _state = {
    player: null,
    room: null,
    gameStarted: null,
    playerGameState: null,
    gamePublicState: null,
    lastAction: null,
    gameResult: null,
  };
  const _listeners = {};

  function set(key, value) {
    const old = _state[key];
    _state[key] = value;
    (_listeners[key] || []).forEach(fn => fn(value, old));
    (_listeners['*'] || []).forEach(fn => fn(key, value, old));
  }

  function get(key) {
    return _state[key];
  }

  function on(key, callback) {
    (_listeners[key] = _listeners[key] || []).push(callback);
    return () => {
      _listeners[key] = _listeners[key].filter(fn => fn !== callback);
    };
  }

  return { set, get, on };
})();
