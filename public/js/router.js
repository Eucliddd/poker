const Router = (() => {
  let currentView = null;

  function navigate(view) {
    if (view === currentView && view === 'game') return; // Already on game page
    currentView = view;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    let pageId;
    if (view === 'lobby') {
      pageId = 'page-lobby';
    } else if (view === 'room-lobby') {
      pageId = 'page-room-lobby';
      Lobby.renderRoomLobby();
    } else if (view === 'game') {
      pageId = 'page-game';
      const room = AppState.get('room');
      if (room) {
        const ui = GameUIRegistry.get(room.gameType);
        if (ui) ui.init();
      }
    }

    if (pageId) {
      document.getElementById(pageId).classList.add('active');
    }

    // Update hash
    if (view === 'lobby') {
      window.location.hash = 'lobby';
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash === 'lobby') {
      currentView = null;
      navigate('lobby');
    }
  });

  return { navigate };
})();
