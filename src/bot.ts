import {Bot, Context, session, type SessionFlavor, GrammyError, HttpError} from "grammy/web";
import {conversations, createConversation, type Conversation, type ConversationFlavor} from "@grammyjs/conversations";
import {autoRetry} from "@grammyjs/auto-retry";
import prisma from "./db";
import {COMMANDS, ADMIN_COMMANDS} from "./constants";
import {CONVERSATION_NAMES} from "./admin/constants";
import {mysub, notify, feedback, feedbackConversation} from "./user";
import {
    adminUsers,
    adminSubscriptions,
    adminGroups,
    adminHolidays,
    adminFeedback,
    adminEarnings,
    adminUserViewConversation,
    adminUserCreateConversation,
    adminUserUpdateConversation,
    adminUserDeleteConversation,
    adminSubscriptionsListConversation,
    adminSubscriptionViewConversation,
    adminSubscriptionCreateConversation,
    adminSubscriptionUpdateConversation,
    adminSubscriptionDeleteConversation,
    adminGroupViewConversation,
    adminGroupCreateConversation,
    adminGroupUpdateConversation,
    adminGroupDeleteConversation,
    adminClassDayAddConversation,
    adminClassDayDeleteConversation,
    adminHolidayViewConversation,
    adminHolidayCreateConversation,
    adminHolidayUpdateConversation,
    adminHolidayDeleteConversation,
    adminFeedbackListConversation,
    adminFeedbackViewConversation,
    adminEarningsCustomConversation
} from "./admin";

interface SessionData {}

export type MyContext = Context & ConversationFlavor<Context> & SessionFlavor<SessionData>;

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set. Please add it to your .env file.");
}

const bot = new Bot<MyContext>(BOT_TOKEN);

bot.api.config.use(autoRetry({
    maxRetryAttempts: 3,
    maxDelaySeconds: 10,
}));

bot.use(session({initial: () => ({})}));
bot.use(conversations());

bot.use(createConversation(feedbackConversation, CONVERSATION_NAMES.FEEDBACK));

bot.use(createConversation(adminUserViewConversation, CONVERSATION_NAMES.ADMIN_USER_VIEW));
bot.use(createConversation(adminUserCreateConversation, CONVERSATION_NAMES.ADMIN_USER_CREATE));
bot.use(createConversation(adminUserUpdateConversation, CONVERSATION_NAMES.ADMIN_USER_UPDATE));
bot.use(createConversation(adminUserDeleteConversation, CONVERSATION_NAMES.ADMIN_USER_DELETE));
bot.use(createConversation(adminSubscriptionsListConversation, CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_LIST));
bot.use(createConversation(adminSubscriptionViewConversation, CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_VIEW));
bot.use(createConversation(adminSubscriptionCreateConversation, CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_CREATE));
bot.use(createConversation(adminSubscriptionUpdateConversation, CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_UPDATE));
bot.use(createConversation(adminSubscriptionDeleteConversation, CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_DELETE));
bot.use(createConversation(adminGroupViewConversation, CONVERSATION_NAMES.ADMIN_GROUP_VIEW));
bot.use(createConversation(adminGroupCreateConversation, CONVERSATION_NAMES.ADMIN_GROUP_CREATE));
bot.use(createConversation(adminGroupUpdateConversation, CONVERSATION_NAMES.ADMIN_GROUP_UPDATE));
bot.use(createConversation(adminGroupDeleteConversation, CONVERSATION_NAMES.ADMIN_GROUP_DELETE));
bot.use(createConversation(adminClassDayAddConversation, CONVERSATION_NAMES.ADMIN_CLASS_DAY_ADD));
bot.use(createConversation(adminClassDayDeleteConversation, CONVERSATION_NAMES.ADMIN_CLASS_DAY_DELETE));
bot.use(createConversation(adminHolidayViewConversation, CONVERSATION_NAMES.ADMIN_HOLIDAY_VIEW));
bot.use(createConversation(adminHolidayCreateConversation, CONVERSATION_NAMES.ADMIN_HOLIDAY_CREATE));
bot.use(createConversation(adminHolidayUpdateConversation, CONVERSATION_NAMES.ADMIN_HOLIDAY_UPDATE));
bot.use(createConversation(adminHolidayDeleteConversation, CONVERSATION_NAMES.ADMIN_HOLIDAY_DELETE));
bot.use(createConversation(adminFeedbackListConversation, CONVERSATION_NAMES.ADMIN_FEEDBACK_LIST));
bot.use(createConversation(adminFeedbackViewConversation, CONVERSATION_NAMES.ADMIN_FEEDBACK_VIEW));
bot.use(createConversation(adminEarningsCustomConversation, CONVERSATION_NAMES.ADMIN_EARNINGS_CUSTOM));

await bot.api.setMyCommands(COMMANDS, {
    scope: {type: "default"}
});

if (process.env.ADMIN_TELEGRAM_ID) {
    // await bot.api.setMyCommands(ADMIN_COMMANDS, {
    //     scope: {type: "chat", chat_id: parseInt(process.env.ADMIN_TELEGRAM_ID)}
    // });
}

bot.command("start", async (ctx) => {
    if (!ctx.from) return;

    try {
        const {
            id,
            first_name,
            last_name,
            username,
            language_code
        } = ctx.from;

        let user = await prisma.user.findUnique({where: {telegramId: BigInt(id)}});

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: BigInt(id),
                    firstName: first_name || null,
                    lastName: last_name || null,
                    username: username || null,
                    languageCode: language_code || null,
                    allowNotifications: true,
                }
            });
        }

        await ctx.reply(`Welcome ${first_name || "there"}!`);
    } catch (error) {
        console.error("Error in /start command:", error);
        await ctx.reply("❌ Sorry, something went wrong. Please try again later.");
    }
});

bot.use(notify);
bot.use(mysub);
bot.use(feedback);

bot.use(adminUsers);
bot.use(adminSubscriptions);
bot.use(adminGroups);
bot.use(adminHolidays);
bot.use(adminFeedback);
bot.use(adminEarnings);

bot.catch((err) => {
    const ctx = err.ctx;
    console.error("Global error handler caught an error:", err.error);
    
    if (err.error instanceof GrammyError) {
        console.error("Grammy error details:", {
            description: err.error.description,
            method: err.error.method,
            parameters: err.error.parameters
        });
    } else if (err.error instanceof HttpError) {
        console.error("HTTP error details:", {
            error: err.error.error
        });
    }
    
    if (ctx.from) {
        console.error("Error context - User:", {
            userId: ctx.from.id,
            username: ctx.from.username,
            firstName: ctx.from.first_name
        });
    }
    
    if (ctx.message) {
        console.error("Error context - Message:", {
            text: ctx.message.text,
            messageId: ctx.message.message_id,
            chatId: ctx.chat?.id
        });
    }
    
    try {
        ctx.reply(
            "❌ An unexpected error occurred. Our team has been notified. Please try again later."
        ).catch((replyError) => {
            console.error("Failed to send error message to user:", replyError);
        });
    } catch (replyError) {
        console.error("Failed to send error message to user:", replyError);
    }
});

const stopOnSignal = async () => {
    console.log("Stopping bot... finishing current tasks.");
    await bot.stop();
    console.log("Bot stopped.");
    process.exit(0);
};

process.once("SIGINT", stopOnSignal);
process.once("SIGTERM", stopOnSignal);

bot.start();