#!/usr/bin/env node
/** CLI admin tool: node server/admin.js <command> [args...] */
const db = require('./db');

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];
const force = process.argv.includes('--yes');

const DESTRUCTIVE = new Set(['reset', 'rooms:delete', 'rooms:clear', 'records:delete']);

if (!cmd) {
  console.log(`用法: node server/admin.js <命令> [参数] [--yes]

 rooms:list                  列出所有房间
 rooms:show <code>           查看房间详情
 rooms:delete <code> --yes   删除房间（需确认）
 rooms:set-state <code> waiting 修复房间状态为waiting（仅DB，不恢复牌局）
 rooms:clear --yes           清空所有房间（需确认）
 users:list                  列出所有用户（最近50）
 users:show <userId>         查看用户详情
 records:list <roomCode>     查看房间牌局记录
 records:delete <handId> --yes 删除牌局记录（需确认）
 reset --yes                 清空用户、房间、牌局记录（需确认）

 破坏性命令需加 --yes，否则拒绝执行。
`);
  process.exit(0);
}

if (DESTRUCTIVE.has(cmd) && !force) {
  console.error(`"${cmd}" 是破坏性命令，请加 --yes 确认`);
  process.exit(1);
}

const d = db.get();

try {
  switch (cmd) {
    case 'reset': {
      d.transaction(() => {
        d.prepare(`DELETE FROM hand_players`).run();
        d.prepare(`DELETE FROM hand_records`).run();
        d.prepare(`DELETE FROM rooms`).run();
        d.prepare(`DELETE FROM users`).run();
      })();
      console.log('已清空所有用户、房间、牌局记录。请重启服务，并刷新浏览器页面。');
      break;
    }
    case 'rooms:list': {
      const rows = d.prepare(`SELECT roomCode, gameType, state, hostUserId, datetime(updatedAt/1000,'unixepoch') as updated FROM rooms ORDER BY updatedAt DESC`).all();
      if (rows.length === 0) { console.log('无房间'); break; }
      rows.forEach(r => console.log(`${r.roomCode}  ${r.gameType.padEnd(8)} ${r.state.padEnd(8)} host=${r.hostUserId}  ${r.updated}`));
      break;
    }
    case 'rooms:show': {
      if (!arg1) { console.log('用法: node server/admin.js rooms:show <code>'); break; }
      const room = d.prepare(`SELECT * FROM rooms WHERE roomCode = ?`).get(arg1.toUpperCase());
      if (!room) { console.log(`房间 ${arg1} 不存在`); break; }
      console.log(`房间: ${room.roomCode}`);
      console.log(`类型: ${room.gameType}`);
      console.log(`状态: ${room.state}`);
      console.log(`设置: ${room.settings}`);
      console.log(`创建: ${new Date(room.createdAt).toISOString()}`);
      console.log(`更新: ${new Date(room.updatedAt).toISOString()}`);
      const players = d.prepare(`SELECT rp.*, u.displayName as userName FROM room_players rp LEFT JOIN users u ON rp.userId = u.userId WHERE rp.roomCode = ? ORDER BY seatIndex`).all(arg1.toUpperCase());
      console.log(`玩家 (${players.length}):`);
      players.forEach(p => console.log(`  #${p.seatIndex} ${p.userName || p.userId} ready=${p.isReady} online=${p.isOnline} chips=${p.chips}`));
      break;
    }
    case 'rooms:delete': {
      if (!arg1) { console.log('用法: node server/admin.js rooms:delete <code> --yes'); break; }
      const code = arg1.toUpperCase();
      d.prepare(`DELETE FROM rooms WHERE roomCode = ?`).run(code);
      console.log(`房间 ${code} 已删除`);
      break;
    }
    case 'rooms:set-state': {
      if (!arg1 || !arg2) { console.log('用法: node server/admin.js rooms:set-state <code> waiting'); break; }
      const code = arg1.toUpperCase();
      if (arg2 !== 'waiting') { console.log('只支持设为 waiting（仅DB修复，不恢复牌局状态）'); break; }
      d.prepare(`UPDATE rooms SET state = ?, updatedAt = ? WHERE roomCode = ?`).run(arg2, Date.now(), code);
      console.log(`房间 ${code} 状态改为 waiting（仅DB层面，服务重启后恢复为等待房间）`);
      break;
    }
    case 'rooms:clear': {
      d.prepare(`DELETE FROM rooms`).run();
      console.log('所有房间已清空');
      break;
    }
    case 'users:list': {
      const rows = d.prepare(`SELECT userId, displayName, datetime(lastSeenAt/1000,'unixepoch') as lastSeen FROM users ORDER BY lastSeenAt DESC LIMIT 50`).all();
      if (rows.length === 0) { console.log('无用户'); break; }
      rows.forEach(u => console.log(`${u.userId}  ${u.displayName.padEnd(12)} ${u.lastSeen}`));
      break;
    }
    case 'users:show': {
      if (!arg1) { console.log('用法: node server/admin.js users:show <userId>'); break; }
      const user = d.prepare(`SELECT * FROM users WHERE userId = ?`).get(arg1);
      if (!user) { console.log(`用户 ${arg1} 不存在`); break; }
      console.log(`ID: ${user.userId}`);
      console.log(`昵称: ${user.displayName}`);
      console.log(`创建: ${new Date(user.createdAt).toISOString()}`);
      console.log(`最近: ${new Date(user.lastSeenAt).toISOString()}`);
      const rooms = d.prepare(`SELECT roomCode FROM room_players WHERE userId = ?`).all(arg1);
      if (rooms.length > 0) console.log(`所在房间: ${rooms.map(r => r.roomCode).join(', ')}`);
      break;
    }
    case 'records:list': {
      if (!arg1) { console.log('用法: node server/admin.js records:list <roomCode>'); break; }
      const records = d.prepare(`SELECT handId, datetime(startedAt/1000,'unixepoch') as started, pot FROM hand_records WHERE roomCode = ? ORDER BY startedAt DESC LIMIT 20`).all(arg1.toUpperCase());
      if (records.length === 0) { console.log(`房间 ${arg1} 无牌局记录`); break; }
      records.forEach(r => {
        const players = d.prepare(`SELECT playerName, buyin, wonAmount, totalBet, folded FROM hand_players WHERE handId = ?`).all(r.handId);
        console.log(`${r.handId}  ${r.started}  底池: ${r.pot}`);
        players.forEach(p => {
          const net = p.wonAmount - p.totalBet;
          const sign = net >= 0 ? '+' : '';
          console.log(`  ${p.playerName.padEnd(10)} 带入:${p.buyin}  净${sign}${net}  ${p.folded ? '弃牌' : ''}`);
        });
      });
      break;
    }
    case 'records:delete': {
      if (!arg1) { console.log('用法: node server/admin.js records:delete <handId> --yes'); break; }
      d.prepare(`DELETE FROM hand_records WHERE handId = ?`).run(arg1);
      console.log(`牌局 ${arg1} 已删除`);
      break;
    }
    default:
      console.log(`未知命令: ${cmd}`);
      process.exit(1);
  }
} catch (e) {
  console.error('执行失败:', e.message);
  process.exit(1);
}
