const Card = require('./Card');

class Deck {
  constructor() {
    this.cards = [];
  }

  static createStandard52() {
    const deck = new Deck();
    const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
    let id = 0;
    for (const suit of suits) {
      for (let rank = 2; rank <= 14; rank++) {
        deck.cards.push(new Card(id++, suit, rank));
      }
    }
    return deck;
  }

  static createStandard54() {
    const deck = Deck.createStandard52();
    deck.cards.push(new Card(52, null, 16, 'small'));
    deck.cards.push(new Card(53, null, 17, 'big'));
    deck.cards[52].joker = 'small';
    deck.cards[53].joker = 'big';
    return deck;
  }

  static createDoubleDeck108() {
    const deck = new Deck();
    const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
    let id = 0;
    for (let copy = 0; copy < 2; copy++) {
      for (const suit of suits) {
        for (let rank = 2; rank <= 14; rank++) {
          deck.cards.push(new Card(id++, suit, rank));
        }
      }
    }
    const j1 = new Card(104, null, 16); j1.joker = 'small'; deck.cards.push(j1);
    const j2 = new Card(105, null, 17); j2.joker = 'big';   deck.cards.push(j2);
    const j3 = new Card(106, null, 16); j3.joker = 'small'; deck.cards.push(j3);
    const j4 = new Card(107, null, 17); j4.joker = 'big';   deck.cards.push(j4);
    return deck;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this;
  }

  deal(count) {
    return this.cards.splice(0, count);
  }

  dealAll(playerCount) {
    const hands = Array.from({ length: playerCount }, () => []);
    let i = 0;
    while (this.cards.length > 0) {
      hands[i % playerCount].push(this.cards.shift());
      i++;
    }
    return hands;
  }
}

module.exports = Deck;
