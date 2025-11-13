import {Bot, Context, session, type SessionFlavor} from "grammy/web";
import {conversations, createConversation, type Conversation, type ConversationFlavor} from "@grammyjs/conversations";
import prisma from "./db.js";
import {COMMANDS} from "./constants.js";
import {mysub, notify, feedback, feedbackConversation} from "./user/index.js";

interface SessionData {}

export type MyContext = Context & ConversationFlavor<Context> & SessionFlavor<SessionData>;

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set. Please add it to your .env file.");
}

const bot = new Bot<MyContext>(BOT_TOKEN);

// Setup session for conversations
bot.use(session({initial: () => ({})}));
bot.use(conversations());

// Register conversations
bot.use(createConversation(feedbackConversation, "feedbackConversation"));

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
bot.use(feedback);

bot.start();