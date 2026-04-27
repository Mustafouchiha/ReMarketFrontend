const { Telegraf } = require("telegraf");
const User = require("./models/User");
const { createToken } = require("./tgTokens");

const MINI_APP_URL = () => process.env.MINI_APP_URL || "https://requrilish.vercel.app/";
const OPERATOR_PHONES = ["331350206"];

let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    bot.command("start", async (ctx) => {
      const tgChatId = ctx.from.id;
      const firstName = ctx.from.first_name || "";

      try {
        const existingUser = await User.findByTgChatId(tgChatId);
        if (existingUser) {
          const token = await createToken(existingUser.id);
          const appUrl = `${MINI_APP_URL()}?tgToken=${token}`;
          return ctx.reply(
            `Salom, ${firstName}! ✅ Xush kelibsiz!\n\nQuyidagi tugmani bosib kiring:`,
            {
              reply_markup: {
                inline_keyboard: [[
                  { text: "🏗 ReQurilish'ga kirish", web_app: { url: appUrl } },
                ]],
              },
            }
          );
        }
      } catch { /* silent */ }

      ctx.reply(
        `Salom! 👋 *ReQurilish*'ga xush kelibsiz!\n\nQurilish materiallari bozori.\n\nKirish uchun telefon raqamingizni yuboring:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [[
              { text: "📱 Telefon yuborish", request_contact: true },
            ]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
    });

    bot.on("contact", async (ctx) => {
      const firstName = ctx.from.first_name || "";
      const tgChatId  = ctx.from.id;
      const rawPhone  = ctx.message.contact.phone_number.replace(/\D/g, "");
      const phone     = rawPhone.startsWith("998") ? rawPhone.slice(3) : rawPhone;

      try {
        let user = await User.findOne({ phone });
        let appUrl;
        let isNew = false;

        if (user) {
          // Mavjud user — tg_chat_id yangilansin
          if (String(user.tg_chat_id) !== String(tgChatId)) {
            user = await User.findByIdAndUpdate(user.id, { tg_chat_id: tgChatId }) || user;
          }
          const token = await createToken(user.id);
          appUrl = `${MINI_APP_URL()}?tgToken=${token}`;
        } else {
          // Yangi user — ro'yxatdan o'tish URL
          isNew = true;
          const tgUsername = ctx.from.username ? `@${ctx.from.username}` : "";
          const params = new URLSearchParams({
            phone,
            tgChatId: String(tgChatId),
            name:     firstName,
            telegram: tgUsername,
            register: "1",
          });
          appUrl = `${MINI_APP_URL()}?${params.toString()}`;
        }

        // Klaviaturani yashirish
        await ctx.reply("✅", { reply_markup: { remove_keyboard: true } });

        const text = isNew
          ? `Salom, ${firstName}! 👋\n\nSiz yangi foydalanuvchisiz.\nQuyidagi havola orqali ro'yxatdan o'ting:`
          : `Salom, ${firstName}! ✅\n\nQuyidagi havola orqali kiring:`;

        // web_app button + oddiy URL button (ikkalasi ham)
        await ctx.reply(text, {
          reply_markup: {
            inline_keyboard: [[
              { text: "🏗 ReQurilish'ga kirish", web_app: { url: appUrl } },
            ], [
              { text: "🔗 Brauzerda ochish", url: appUrl },
            ]],
          },
        });

      } catch (e) {
        console.error("Bot contact handler xatosi:", e.message, e.stack);
        // Debug: foydalanuvchiga ham ko'rsatamiz
        ctx.reply(
          `⚠️ Vaqtinchalik xato: ${e.message}\n\n/start bosib qayta urinib ko'ring.`
        ).catch(() => {});
      }
    });

    bot.command("id", (ctx) => {
      ctx.reply(`🆔 Sizning Telegram ID: \`${ctx.from.id}\``, { parse_mode: "Markdown" });
    });

    bot.command("help", (ctx) => {
      ctx.reply(
        `📖 *ReQurilish Bot yordam*\n\n` +
        `/start — Botni boshlash, kirish havolasi\n` +
        `/id — Telegram ID ni ko'rish\n\n` +
        `❓ Muammo bo'lsa: @Requrilish_admin ga murojaat qiling`,
        { parse_mode: "Markdown" }
      );
    });

    bot.launch()
      .then(() => console.log("🤖 ReQurilish bot ishga tushdi (polling rejim)"))
      .catch(err => {
        console.error("❌ Bot launch xatosi:", err.message);
        if (err.message.includes("401")) {
          console.error("⚠️  TELEGRAM_BOT_TOKEN noto'g'ri! @BotFather dan token oling.");
        }
      });

    process.once("SIGINT",  () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  }
  return bot;
}

async function notifyUser(tgChatId, text, extra = {}) {
  if (!tgChatId) return;
  try {
    const { sendTg } = require('./utils/telegram');
    await sendTg(tgChatId, text, extra);
  } catch (e) {
    console.error("Bot xabar yuborishda xato:", e.message);
  }
}

// Barcha operatorlarga xabar yuborish
async function notifyOperator(text) {
  const b = getBot();
  if (!b) return;
  try {
    const { query } = require("./db");
    const { rows } = await query(
      "SELECT tg_chat_id FROM users WHERE phone = ANY($1) AND tg_chat_id IS NOT NULL",
      [OPERATOR_PHONES]
    );
    for (const row of rows) {
      await notifyUser(row.tg_chat_id, text).catch(() => {});
    }
  } catch (e) {
    console.error("notifyOperator xatosi:", e.message);
  }
}

module.exports = { getBot, notifyUser, notifyOperator };
