import {Composer} from "grammy/web";
import {type MyContext} from "../bot.js";
import type {Conversation} from "@grammyjs/conversations";
import prisma from "../db.js";


async function feedbackConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    if (!ctx.from) {
        await ctx.reply("Unable to identify user. Please try again.");
        return;
    }

    let user = await prisma.user.findUnique({where: {telegramId: ctx.from.id}});
    
    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramId: ctx.from.id,
                firstName: ctx.from.first_name || null,
                lastName: ctx.from.last_name || null,
                username: ctx.from.username || null,
                languageCode: ctx.from.language_code || null,
                allowNotifications: true,
            }
        });
    }

    await ctx.reply(
        "📝 Please share your feedback with us!\n\n" +
        "Tell us about your experience, suggestions, or any concerns.\n\n" +
        "Type /cancel to cancel at any time."
    );

    const messageCtx = await conversation.wait();

    if (messageCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Feedback cancelled.");
        return;
    }

    const feedbackMessage = messageCtx.message?.text;

    if (!feedbackMessage || feedbackMessage.trim().length === 0) {
        await ctx.reply("❌ Feedback cannot be empty. Please try again with /feedback");
        return;
    }

    const feedback = await prisma.feedback.create({
        data: {
            userId: user.id,
            telegramId: ctx.from.id,
            userName: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || null,
            languageCode: ctx.from.language_code || null,
            message: feedbackMessage,
        }
    });

    await ctx.reply(
        "✅ Thank you for your feedback!\n\n" +
        "We appreciate you taking the time to share your thoughts with us. " +
        "Your feedback helps us improve our service."
    );

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
    await ctx.conversation.enter("feedbackConversation");
});

export {feedbackConversation};