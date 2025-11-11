import {Bot} from "grammy/web";
import prisma from "./db.js";
import {COMMANDS} from "./constants.js";
import {mysub, notify} from "./user/index.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set. Please add it to your .env file.");
}

const bot = new Bot(BOT_TOKEN);
await bot.api.setMyCommands(COMMANDS);

bot.command("start", async (ctx) => {
    if (!ctx.from) return;

    const {
        id,
        first_name,
        last_name,
        username,
        language_code
    } = ctx.from;

    let user = await prisma.user.findUnique({where: {telegramId: id}});

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramId: id,
                firstName: first_name || null,
                lastName: last_name || null,
                username: username || null,
                languageCode: language_code || null,
                allowNotifications: true,
            }
        });
    }

    ctx.reply(`Welcome ${first_name || "there"}!`);
});

bot.use(notify);
bot.use(mysub);

bot.start();