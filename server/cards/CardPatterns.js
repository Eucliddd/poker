// Texas Hold'em Hand Evaluator

const HAND_RANK = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
};

const HAND_NAMES = {
  0: '高牌',
  1: '一对',
  2: '两对',
  3: '三条',
  4: '顺子',
  5: '同花',
  6: '葫芦',
  7: '四条',
  8: '同花顺',
  9: '皇家同花顺',
};

function evaluateHand(cards) {
  // cards: array of 5-7 Card objects
  // Returns best 5-card hand: { rank, name, value, bestCards, kickers }

  if (cards.length < 5) return null;

  // Generate all C(n,5) combinations
  const combos = getCombinations(cards, 5);
  let best = null;
  let bestScore = -1;

  for (const combo of combos) {
    const result = evaluate5(combo);
    if (result.score > bestScore) {
      bestScore = result.score;
      best = result;
    }
  }

  return best;
}

function evaluate5(cards) {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);

  // Count rank occurrences
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const groups = Object.entries(counts).map(([r, c]) => [parseInt(r), c]);
  groups.sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let rank, name, score;

  if (isFlush && isStraight) {
    const high = ranks[0] === 14 && ranks[1] === 5 ? 5 : ranks[0];
    if (high === 14) {
      rank = HAND_RANK.ROYAL_FLUSH;
      name = HAND_NAMES[9];
    } else {
      rank = HAND_RANK.STRAIGHT_FLUSH;
      name = HAND_NAMES[8];
    }
    score = (rank << 20) | (high << 16);
  } else if (groups[0][1] === 4) {
    rank = HAND_RANK.FOUR_KIND;
    name = HAND_NAMES[7];
    score = (rank << 20) | (groups[0][0] << 16) | (groups[1][0] << 12);
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    rank = HAND_RANK.FULL_HOUSE;
    name = HAND_NAMES[6];
    score = (rank << 20) | (groups[0][0] << 16) | (groups[1][0] << 12);
  } else if (isFlush) {
    rank = HAND_RANK.FLUSH;
    name = HAND_NAMES[5];
    score = (rank << 20) | (ranks[0] << 16) | (ranks[1] << 12) | (ranks[2] << 8) | (ranks[3] << 4) | ranks[4];
  } else if (isStraight) {
    const high = ranks[0] === 14 && ranks[1] === 5 ? 5 : ranks[0];
    rank = HAND_RANK.STRAIGHT;
    name = HAND_NAMES[4];
    score = (rank << 20) | (high << 16);
  } else if (groups[0][1] === 3) {
    rank = HAND_RANK.THREE_KIND;
    name = HAND_NAMES[3];
    const kickers = groups.filter(g => g[1] === 1).map(g => g[0]).sort((a, b) => b - a);
    score = (rank << 20) | (groups[0][0] << 16) | (kickers[0] << 12) | (kickers[1] << 8);
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    rank = HAND_RANK.TWO_PAIR;
    name = HAND_NAMES[2];
    const highPair = Math.max(groups[0][0], groups[1][0]);
    const lowPair = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups[2][0];
    score = (rank << 20) | (highPair << 16) | (lowPair << 12) | (kicker << 8);
  } else if (groups[0][1] === 2) {
    rank = HAND_RANK.ONE_PAIR;
    name = HAND_NAMES[1];
    const kickers = groups.filter(g => g[1] === 1).map(g => g[0]).sort((a, b) => b - a);
    score = (rank << 20) | (groups[0][0] << 16) | (kickers[0] << 12) | (kickers[1] << 8) | (kickers[2] << 4);
  } else {
    rank = HAND_RANK.HIGH_CARD;
    name = HAND_NAMES[0];
    score = (rank << 20) | (ranks[0] << 16) | (ranks[1] << 12) | (ranks[2] << 8) | (ranks[3] << 4) | ranks[4];
  }

  return { rank, name, score, bestCards: cards.slice(0, 5) };
}

function checkStraight(ranks) {
  // Handle A-2-3-4-5 (wheel)
  if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
    return true;
  }
  for (let i = 0; i < 4; i++) {
    if (ranks[i] - ranks[i + 1] !== 1) return false;
  }
  return true;
}

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result = [];
  const [first, ...rest] = arr;
  // Combos including first
  for (const combo of getCombinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  // Combos not including first
  result.push(...getCombinations(rest, k));
  return result;
}

module.exports = { evaluateHand, HAND_RANK, HAND_NAMES };
