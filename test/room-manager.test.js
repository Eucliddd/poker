const { test } = require('node:test');
const assert = require('node:assert');
const RoomManager = require('../server/rooms/RoomManager');
const Room = require('../server/rooms/Room');

test('RoomManager - create and join', async (t) => {
  await t.test('creates a room and auto-readies host', () => {
    const rm = new RoomManager();
    const result = rm.createRoom('texas', 'sock1', 'Alice');
    assert.equal(result.error, undefined);
    assert.ok(result.room);
    assert.ok(result.player);
    assert.equal(result.room.code.length, 4);
    assert.equal(result.room.gameType, 'texas');
    assert.equal(result.room.players.length, 1);
    assert.equal(result.player.isReady, true, 'Host should be auto-ready');
  });

  await t.test('generates unique room codes', () => {
    const rm = new RoomManager();
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      const r = rm.createRoom('texas', `s${i}`, `Player${i}`);
      codes.add(r.room.code);
    }
    // All codes should be unique (probabilistic, but 100 rooms from 31^4 space)
    assert.ok(codes.size >= 99, `Expected >=99 unique codes, got ${codes.size}`);
  });

  await t.test('joins an existing room', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('texas', 'sock1', 'Alice');
    const result = rm.joinRoom(room.code, 'sock2', 'Bob');

    assert.equal(result.error, undefined);
    assert.equal(result.room.players.length, 2);
    assert.equal(result.player.name, 'Bob');
    assert.equal(result.player.seatIndex, 1);
  });

  await t.test('rejects join on non-existent room', () => {
    const rm = new RoomManager();
    const result = rm.joinRoom('XXXX', 'sock1', 'Alice');
    assert.ok(result.error);
  });

  await t.test('rejects join on full room', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('texas', 'sock1', 'Alice');
    // Fill to max (9 for texas)
    for (let i = 1; i < 9; i++) {
      rm.joinRoom(room.code, `s${i + 1}`, `Player${i}`);
    }
    const result = rm.joinRoom(room.code, 'sock11', 'Extra');
    assert.ok(result.error);
    assert.equal(result.error, '房间已满');
  });
});

test('RoomManager - leave and disconnect', async (t) => {
  await t.test('player leaves room', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('texas', 'sock1', 'Alice');
    rm.joinRoom(room.code, 'sock2', 'Bob');

    const result = rm.leaveRoom('sock2');
    assert.equal(result.room.players.length, 1);
    assert.equal(room.players[0].name, 'Alice');
  });

  await t.test('host transfers on leave', () => {
    const rm = new RoomManager();
    const { room, player: alice } = rm.createRoom('texas', 'sock1', 'Alice');
    const { player: bob } = rm.joinRoom(room.code, 'sock2', 'Bob');

    assert.equal(room.hostId, alice.id);
    rm.leaveRoom('sock1');
    assert.equal(room.hostId, bob.id);
  });

  await t.test('empty room is cleaned up', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('texas', 'sock1', 'Alice');
    const code = room.code;
    rm.leaveRoom('sock1');
    assert.equal(rm.getRoomByCode(code), undefined);
  });

  await t.test('disconnect marks player offline', () => {
    const rm = new RoomManager();
    const { room } = rm.createRoom('texas', 'sock1', 'Alice');
    const result = rm.disconnectSocket('sock1');
    assert.ok(result);
    assert.equal(room.players[0].isOnline, false);
  });

  await t.test('reconnect updates socket and re-onlines player', () => {
    const rm = new RoomManager();
    const { room, player } = rm.createRoom('texas', 'sock1', 'Alice');
    rm.disconnectSocket('sock1');
    const result = rm.reconnectSocket('sock2_new', player.id);
    assert.ok(result);
    assert.equal(room.players[0].isOnline, true);
    assert.equal(room.players[0].socketId, 'sock2_new');
  });
});

test('Room - settings', async (t) => {
  await t.test('default settings are populated', () => {
    const room = new Room('TEST', 'texas', 'host1');
    assert.equal(room.settings.smallBlind, 10);
    assert.equal(room.settings.bigBlind, 20);
    assert.equal(room.settings.defaultChips, 1000);
    assert.equal(room.settings.turnTime, 30);
    assert.equal(room.settings.runItTwice, false);
    assert.equal(room.settings.rebuyEnabled, true);
    assert.equal(room.settings.rebuyMin, 200);
    assert.equal(room.settings.rebuyMax, 2000);
  });

  await t.test('host can update settings', () => {
    const room = new Room('TEST', 'texas', 'host1');
    const result = room.updateSettings('host1', {
      smallBlind: 25,
      bigBlind: 50,
      turnTime: 60,
    });
    assert.equal(result.error, undefined);
    assert.equal(room.settings.smallBlind, 25);
    assert.equal(room.settings.bigBlind, 50);
    assert.equal(room.settings.turnTime, 60);
    // Unchanged settings stay the same
    assert.equal(room.settings.runItTwice, false);
  });

  await t.test('non-host cannot update settings', () => {
    const room = new Room('TEST', 'texas', 'host1');
    const result = room.updateSettings('guest', { smallBlind: 100 });
    assert.ok(result.error);
    assert.equal(room.settings.smallBlind, 10); // unchanged
  });

  await t.test('invalid settings are rejected', () => {
    const room = new Room('TEST', 'texas', 'host1');
    const result = room.updateSettings('host1', { invalidKey: 123 });
    assert.ok(result.error);
  });

  await t.test('swaps blinds if big < small', () => {
    const room = new Room('TEST', 'texas', 'host1');
    room.updateSettings('host1', { smallBlind: 100, bigBlind: 50 });
    assert.equal(room.settings.smallBlind, 50);
    assert.equal(room.settings.bigBlind, 100);
  });
});

test('Room - canStart', async (t) => {
  await t.test('returns false if not enough players', () => {
    const room = new Room('TEST', 'texas', 'host1');
    assert.equal(room.canStart(), false);
  });

  await t.test('returns false if players not ready', () => {
    const room = new Room('TEST', 'texas', 'host1');
    room.addPlayer({ id: 'p1', isReady: true, seatIndex: 0, toJSON: () => ({}) });
    room.addPlayer({ id: 'p2', isReady: false, seatIndex: 1, toJSON: () => ({}) });
    assert.equal(room.canStart(), false);
  });

  await t.test('returns true when all ready and min met', () => {
    const room = new Room('TEST', 'texas', 'host1');
    room.addPlayer({ id: 'p1', isReady: true, seatIndex: 0, toJSON: () => ({}) });
    room.addPlayer({ id: 'p2', isReady: true, seatIndex: 1, toJSON: () => ({}) });
    assert.equal(room.canStart(), true);
  });
});
