const CardRenderer = (() => {
  function createCard(card, opts = {}) {
    const { faceUp = true, small = false, onClick = null, selectable = false } = opts;
    const el = document.createElement('div');
    el.className = 'card';
    if (selectable) el.classList.add('playable');
    if (faceUp && card) {
      if (card.joker === 'small') {
        el.innerHTML = '<span class="card-rank" style="color:#333">小</span><span class="card-suit" style="color:#333">王</span>';
      } else if (card.joker === 'big') {
        el.innerHTML = '<span class="card-rank" style="color:#d32f2f">大</span><span class="card-suit" style="color:#d32f2f">王</span>';
      } else {
        const rank = rankDisplay(card.rank);
        const suit = suitDisplay(card.suit);
        const color = (card.suit === 'hearts' || card.suit === 'diamonds') ? '#d32f2f' : '#212121';
        el.innerHTML = `
          <span class="card-rank" style="color:${color}">${rank}</span>
          <span class="card-suit" style="color:${color}">${suit}</span>
          <span class="card-corner" style="color:${color}">${rank}${suit}</span>
        `;
      }
      el.dataset.cardId = card.id;
    } else {
      el.classList.add('card-back');
    }

    if (small) {
      el.style.width = '36px';
      el.style.height = '52px';
      el.style.fontSize = '10px';
    }

    if (onClick) {
      el.addEventListener('click', () => onClick(card));
    }
    return el;
  }

  function rankDisplay(rank) {
    const map = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    return map[rank] || String(rank);
  }

  function suitDisplay(suit) {
    const map = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' };
    return map[suit] || '';
  }

  function renderHand(container, cards, opts = {}) {
    container.innerHTML = '';
    const { selectable = false, selected = new Set(), onSelect = null, sort = true } = opts;

    let sorted = cards;
    if (sort) {
      sorted = [...cards].sort((a, b) => {
        if (a.joker && b.joker) return a.joker === 'big' ? -1 : 1;
        if (a.joker) return -1;
        if (b.joker) return 1;
        return b.rank - a.rank || a.suit.localeCompare(b.suit);
      });
    }

    sorted.forEach(card => {
      const el = createCard(card, {
        selectable,
        onClick: onSelect ? (c) => onSelect(c) : null,
      });
      if (selected.has(card.id)) el.classList.add('selected');
      container.appendChild(el);
    });
  }

  function renderBackCards(container, count, small = false) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      container.appendChild(createCard(null, { faceUp: false, small }));
    }
  }

  function dealCards(container, cards, opts = {}) {
    const { faceUp = true, small = false, delay = 200, sort = true } = opts;
    container.innerHTML = '';

    let sorted = [...cards];
    if (sort) {
      sorted.sort((a, b) => {
        if (a.joker && b.joker) return a.joker === 'big' ? -1 : 1;
        if (a.joker) return -1;
        if (b.joker) return 1;
        return b.rank - a.rank || a.suit.localeCompare(b.suit);
      });
    }

    sorted.forEach((card, i) => {
      setTimeout(() => {
        const el = createCard(faceUp ? card : null, {
          faceUp,
          small,
          selectable: false,
        });
        el.classList.add('dealing');
        container.appendChild(el);
      }, i * delay);
    });

    return cards.length * delay + 400; // total animation time
  }

  return { createCard, renderHand, renderBackCards, dealCards, rankDisplay, suitDisplay };
})();

const Toast = (() => {
  let container;

  function init() {
    container = document.getElementById('toast-container');
  }

  function show(message, type = 'info', duration = 3000) {
    if (!container) init();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return { show, init };
})();
