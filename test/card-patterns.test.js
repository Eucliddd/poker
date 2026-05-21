const { test } = require('node:test');
const assert = require('node:assert');
const Card = require('../server/cards/Card');
const { evaluateHand, HAND_RANK } = require('../server/cards/CardPatterns');

function makeCards(descs) {
  // descs: array of [rank, suit] e.g. [14, 'spades'] or 'joker'
  let id = 0;
  return descs.map(d => {
    if (d === 'small') return Object.assign(new Card(id++, null, 16), { joker: 'small' });
    if (d === 'big') return Object.assign(new Card(id++, null, 17), { joker: 'big' });
    return new Card(id++, d[1], d[0]);
  });
}

function pair(rank, suit1, suit2) {
  return [[rank, suit1], [rank, suit2]];
}

test('Hand Evaluation - High Card', async (t) => {
  await t.test('basic high card', () => {
    const cards = makeCards([[14, 'spades'], [10, 'hearts'], [7, 'clubs'], [4, 'diamonds'], [2, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.HIGH_CARD);
    assert.equal(result.name, '高牌');
  });
});

test('Hand Evaluation - One Pair', async (t) => {
  await t.test('pair of aces', () => {
    const cards = makeCards([[14, 'spades'], [14, 'hearts'], [10, 'clubs'], [7, 'diamonds'], [2, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.ONE_PAIR);
    assert.equal(result.name, '一对');
  });
});

test('Hand Evaluation - Two Pair', async (t) => {
  await t.test('aces and kings', () => {
    const cards = makeCards([[14, 'spades'], [14, 'hearts'], [13, 'clubs'], [13, 'diamonds'], [2, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.TWO_PAIR);
    assert.equal(result.name, '两对');
  });
});

test('Hand Evaluation - Three of a Kind', async (t) => {
  await t.test('three queens', () => {
    const cards = makeCards([[12, 'spades'], [12, 'hearts'], [12, 'clubs'], [7, 'diamonds'], [2, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.THREE_KIND);
    assert.equal(result.name, '三条');
  });
});

test('Hand Evaluation - Straight', async (t) => {
  await t.test('9-10-J-Q-K straight', () => {
    const cards = makeCards([[9, 'spades'], [10, 'hearts'], [11, 'clubs'], [12, 'diamonds'], [13, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.STRAIGHT);
    assert.equal(result.name, '顺子');
  });

  await t.test('A-2-3-4-5 wheel straight', () => {
    const cards = makeCards([[14, 'spades'], [2, 'hearts'], [3, 'clubs'], [4, 'diamonds'], [5, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.STRAIGHT);
    assert.equal(result.name, '顺子');
  });
});

test('Hand Evaluation - Flush', async (t) => {
  await t.test('spade flush', () => {
    const cards = makeCards([[14, 'spades'], [10, 'spades'], [7, 'spades'], [4, 'spades'], [2, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.FLUSH);
    assert.equal(result.name, '同花');
  });
});

test('Hand Evaluation - Full House', async (t) => {
  await t.test('aces full of kings', () => {
    const cards = makeCards([[14, 'spades'], [14, 'hearts'], [14, 'clubs'], [13, 'diamonds'], [13, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.FULL_HOUSE);
    assert.equal(result.name, '葫芦');
  });
});

test('Hand Evaluation - Four of a Kind', async (t) => {
  await t.test('four kings', () => {
    const cards = makeCards([[13, 'spades'], [13, 'hearts'], [13, 'clubs'], [13, 'diamonds'], [2, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.FOUR_KIND);
    assert.equal(result.name, '四条');
  });
});

test('Hand Evaluation - Straight Flush', async (t) => {
  await t.test('9-10-J-Q-K all spades', () => {
    const cards = makeCards([[9, 'spades'], [10, 'spades'], [11, 'spades'], [12, 'spades'], [13, 'spades']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.STRAIGHT_FLUSH);
    assert.equal(result.name, '同花顺');
  });
});

test('Hand Evaluation - Royal Flush', async (t) => {
  await t.test('10-J-Q-K-A all hearts', () => {
    const cards = makeCards([[10, 'hearts'], [11, 'hearts'], [12, 'hearts'], [13, 'hearts'], [14, 'hearts']]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.ROYAL_FLUSH);
    assert.equal(result.name, '皇家同花顺');
  });
});

test('Hand Evaluation - Best 5 of 7', async (t) => {
  await t.test('finds flush among 7 cards', () => {
    // 5 spades + 2 other cards
    const cards = makeCards([
      [14, 'spades'], [10, 'spades'], [7, 'spades'], [4, 'spades'], [2, 'spades'],
      [13, 'hearts'], [12, 'clubs'],
    ]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.FLUSH);
  });

  await t.test('finds straight among 7 cards ignoring flush', () => {
    // Has both flush and straight potential
    const cards = makeCards([
      [10, 'spades'], [11, 'hearts'], [12, 'clubs'], [13, 'diamonds'], [9, 'spades'],
      [7, 'hearts'], [2, 'clubs'],
    ]);
    const result = evaluateHand(cards);
    assert.equal(result.rank, HAND_RANK.STRAIGHT);
  });
});

test('Hand Evaluation - Comparison', async (t) => {
  await t.test('higher full house beats lower', () => {
    const aces = makeCards([[14, 'spades'], [14, 'hearts'], [14, 'clubs'], [13, 'diamonds'], [13, 'spades']]);
    const kings = makeCards([[13, 'spades'], [13, 'hearts'], [13, 'clubs'], [14, 'diamonds'], [14, 'spades']]);
    const r1 = evaluateHand(aces);
    const r2 = evaluateHand(kings);
    assert.ok(r1.score > r2.score, 'Aces full should beat Kings full');
  });

  await t.test('royal flush beats four of a kind', () => {
    const royal = makeCards([[10, 'hearts'], [11, 'hearts'], [12, 'hearts'], [13, 'hearts'], [14, 'hearts']]);
    const quads = makeCards([[13, 'spades'], [13, 'hearts'], [13, 'clubs'], [13, 'diamonds'], [14, 'spades']]);
    assert.ok(evaluateHand(royal).score > evaluateHand(quads).score);
  });

  await t.test('same hand compares kickers', () => {
    const high = makeCards([[14, 'spades'], [14, 'hearts'], [10, 'clubs'], [7, 'diamonds'], [5, 'spades']]);
    const low = makeCards([[14, 'spades'], [14, 'hearts'], [9, 'clubs'], [7, 'diamonds'], [5, 'spades']]);
    assert.ok(evaluateHand(high).score > evaluateHand(low).score);
  });
});
