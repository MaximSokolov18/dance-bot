import {Composer} from "grammy/web";
import {type MyContext} from "../bot";
import type {Conversation} from "@grammyjs/conversations";
import prisma from "../db";
import {CONVERSATION_NAMES} from "../admin/constants";
import {translate} from "../utils";


async function feedbackConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    if (!ctx.from) {
        await ctx.reply(translate("en", "common-unable-to-identify"));
        return;
    }

    let user = await prisma.user.findUnique({where: {telegramId: BigInt(ctx.from.id)}});
    
    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramId: BigInt(ctx.from.id),
                firstName: ctx.from.first_name || null,
                lastName: ctx.from.last_name || null,
                username: ctx.from.username || null,
                languageCode: ctx.from.language_code || "en",
                allowNotifications: true,
            }
        });
    }

    const userLang = user.languageCode || "en";

    await ctx.reply(translate(userLang, "feedback-prompt"));

    const messageCtx = await conversation.wait();

    if (messageCtx.message?.text === "/cancel") {
        await ctx.reply(translate(userLang, "feedback-cancelled"));
        return;
    }

    const feedbackMessage = messageCtx.message?.text;

    if (!feedbackMessage || feedbackMessage.trim().length === 0) {
        await ctx.reply(translate(userLang, "feedback-empty"));
        return;
    }

    const feedback = await prisma.feedback.create({
        data: {
            userId: user.id,
            telegramId: BigInt(ctx.from.id),
            userName: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || null,
            languageCode: ctx.from.language_code || null,
            message: feedbackMessage,
        }
    });

    await ctx.reply(translate(userLang, "feedback-thanks"));

    if (process.env.ADMIN_TELEGRAM_ID) {
        const fullName = feedback.userName || "Anonymous";
        const username = ctx.from.username ? `@${ctx.from.username}` : "No username";
        const notificationMessage = 
            `🔔 New Feedback Received!\n\n` +
            `👤 Full name: ${fullName}\n` +
            `📱 Username: ${username}\n` +
            `📅 Date: ${feedback.createdAt.toLocaleString()}\n\n` +
            `💬 Message:\n${feedback.message}`;

        try {
            await ctx.api.sendMessage(process.env.ADMIN_TELEGRAM_ID, notificationMessage);
            console.log(`Feedback notification sent to admin ${process.env.ADMIN_TELEGRAM_ID}`);
        } catch (error) {
            console.error(`Failed to send notification to admin ${process.env.ADMIN_TELEGRAM_ID}:`, error);
        }
    } else {
        console.log("ADMIN_TELEGRAM_ID not set - no notification sent");
    }
}

export const feedback = new Composer<MyContext>();

feedback.command("feedback", async (ctx) => {
    await ctx.conversation.enter(CONVERSATION_NAMES.FEEDBACK);
});

export {feedbackConversation};