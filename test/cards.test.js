const { test } = require('node:test');
const assert = require('node:assert');
const Card = require('../server/cards/Card');
const Deck = require('../server/cards/Deck');

test('Card - creation and properties', async (t) => {
  await t.test('creates a standard card', () => {
    const card = new Card(0, 'spades', 14);
    assert.equal(card.id, 0);
    assert.equal(card.suit, 'spades');
    assert.equal(card.rank, 14);
    assert.equal(card.joker, null);
  });

  await t.test('displayName for Ace of Spades', () => {
    const card = new Card(0, 'spades', 14);
    assert.equal(card.displayName, 'A♠');
  });

  await t.test('displayName for small joker', () => {
    const card = new Card(52, null, 16);
    card.joker = 'small';
    assert.equal(card.displayName, '小王');
  });

  await t.test('isRed for hearts', () => {
    const card = new Card(0, 'hearts', 10);
    assert.equal(card.isRed, true);
  });

  await t.test('isRed for clubs', () => {
    const card = new Card(0, 'clubs', 10);
    assert.equal(card.isRed, false);
  });

  await t.test('toJSON serialization', () => {
    const card = new Card(5, 'diamonds', 11);
    const json = card.toJSON();
    assert.equal(json.id, 5);
    assert.equal(json.suit, 'diamonds');
    assert.equal(json.rank, 11);
  });

  await t.test('rank names', () => {
    assert.equal(Card.getRankName(11), 'J');
    assert.equal(Card.getRankName(12), 'Q');
    assert.equal(Card.getRankName(13), 'K');
    assert.equal(Card.getRankName(14), 'A');
    assert.equal(Card.getRankName(7), '7');
  });
});

test('Deck - creation', async (t) => {
  await t.test('standard 52-card deck', () => {
    const deck = Deck.createStandard52();
    assert.equal(deck.cards.length, 52);
    // Check suits are balanced
    const suits = {};
    deck.cards.forEach(c => suits[c.suit] = (suits[c.suit] || 0) + 1);
    assert.equal(suits.spades, 13);
    assert.equal(suits.hearts, 13);
    assert.equal(suits.clubs, 13);
    assert.equal(suits.diamonds, 13);
  });

  await t.test('standard 54-card deck (with jokers)', () => {
    const deck = Deck.createStandard54();
    assert.equal(deck.cards.length, 54);
    const jokers = deck.cards.filter(c => c.joker);
    assert.equal(jokers.length, 2);
    assert.equal(jokers[0].joker, 'small');
    assert.equal(jokers[1].joker, 'big');
  });

  await t.test('double deck 108 cards', () => {
    const deck = Deck.createDoubleDeck108();
    assert.equal(deck.cards.length, 108);
    const jokers = deck.cards.filter(c => c.joker);
    assert.equal(jokers.length, 4);
  });
});

test('Deck - shuffle', async (t) => {
  await t.test('shuffle preserves all cards', () => {
    const deck = Deck.createStandard52();
    const origIds = deck.cards.map(c => c.id).sort((a, b) => a - b);
    deck.shuffle();
    const shuffledIds = deck.cards.map(c => c.id).sort((a, b) => a - b);
    assert.deepEqual(shuffledIds, origIds);
  });

  await t.test('shuffle changes order (probabilistic)', () => {
    const deck = Deck.createStandard52();
    const origOrder = deck.cards.map(c => c.id).join(',');
    deck.shuffle();
    const newOrder = deck.cards.map(c => c.id).join(',');
    // 52! chance of same order - effectively impossible if shuffle works
    assert.notEqual(newOrder, origOrder);
  });
});

test('Deck - deal', async (t) => {
  await t.test('deal single card', () => {
    const deck = Deck.createStandard52();
    const cards = deck.deal(1);
    assert.equal(cards.length, 1);
    assert.equal(deck.cards.length, 51);
  });

  await t.test('deal multiple cards', () => {
    const deck = Deck.createStandard52();
    const cards = deck.deal(5);
    assert.equal(cards.length, 5);
    assert.equal(deck.cards.length, 47);
  });

  await t.test('dealAll distributes evenly', () => {
    const deck = Deck.createStandard52();
    const hands = deck.dealAll(4);
    assert.equal(hands.length, 4);
    assert.equal(hands[0].length, 13);
    assert.equal(hands[1].length, 13);
    assert.equal(hands[2].length, 13);
    assert.equal(hands[3].length, 13);
    assert.equal(deck.cards.length, 0);
  });

  await t.test('dealAll with 54 cards and 3 players', () => {
    const deck = Deck.createStandard54();
    const hands = deck.dealAll(3);
    assert.equal(hands.length, 3);
    assert.equal(hands[0].length, 18);
    assert.equal(hands[1].length, 18);
    assert.equal(hands[2].length, 18);
  });
});
