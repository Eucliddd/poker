# 扑克游戏平台

支持私人联机的在线扑克平台，目前支持**德州扑克**。

## 快速开始

```bash
npm install
npm start
```

浏览器打开 `http://localhost:3000`，多个标签页即可联机对战。

## 玩法

1. 输入昵称，点击 **创建房间**，获得 4 位房间码
2. 好友输入房间码 **加入房间**，房主可配置游戏参数
3. 全部准备 → 房主点击 **开始游戏**
4. 按提示操作：弃牌 / 过牌 / 跟注 / 加注 / All-in
5. 一局结束后点击 **下一局** 继续

## 远程联机

### 方法 1：Cloudflare Tunnel（免费，无需服务器）

```bash
# 安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# 启动游戏
npm start

# 另一个终端创建公网隧道
./cloudflared tunnel --url http://localhost:3000
```

输出 `https://xxx.trycloudflare.com` 分享给好友即可。

### 方法 2：部署到云服务器

```bash
# 服务器上
git clone <repo> && cd poker
npm install
npm start
# 安全组放行 3000 端口
```

访问 `http://<服务器IP>:3000`。

### 方法 3：frp 内网穿透

在 `server/config.js` 中可通过环境变量 `PORT` 自定义端口：

```bash
PORT=8080 npm start
```

## 房间设置

房主在房间大厅可展开设置面板：

| 设置 | 说明 | 默认 |
|---|---|---|
| 回合时间 | 超时自动弃牌 | 30s |
| 小盲 / 大盲 | 盲注金额 | 10 / 20 |
| 初始筹码 | 每人起始筹码 | 1000 |
| Run It Twice | all-in 后发两次公共牌 | 关 |
| 补筹码 | 允许买入及范围 | 200-2000 |

## 命令

```bash
npm start          # 启动服务器
npm run dev        # 开发模式（自动重启）
npm test           # 运行所有测试
npm run test:cards # 仅卡牌测试
npm run test:texas # 仅德州引擎测试
```

## 技术栈

Node.js + Express + Socket.IO，纯 HTML/CSS/JS 前端，无需数据库。
