class Card {
  constructor(id, suit, rank) {
    this.id = id;
    this.suit = suit;       // 'spades' | 'hearts' | 'clubs' | 'diamonds' | null
    this.rank = rank;       // 2-14 (2=2, 14=A)
    this.joker = null;      // null | 'small' | 'big'
  }

  // For serialization
  toJSON() {
    return { id: this.id, suit: this.suit, rank: this.rank, joker: this.joker };
  }

  static getRankName(rank) {
    const names = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    return names[rank] || String(rank);
  }

  static getSuitSymbol(suit) {
    const symbols = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' };
    return symbols[suit] || '';
  }

  get displayName() {
    if (this.joker === 'small') return '小王';
    if (this.joker === 'big') return '大王';
    return `${Card.getRankName(this.rank)}${Card.getSuitSymbol(this.suit)}`;
  }

  get isRed() {
    return this.suit === 'hearts' || this.suit === 'diamonds';
  }
}

module.exports = Card;
