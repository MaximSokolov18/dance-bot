import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot.js";
import {adminMiddleware} from "./middleware.js";
import prisma from "../db.js";
import type {Conversation} from "@grammyjs/conversations";
import {ADMIN_FEEDBACK_CALLBACKS, FEEDBACK_FILTERS, CONVERSATION_NAMES} from "./constants.js";

export const adminFeedback = new Composer<MyContext>();
adminFeedback.use(adminMiddleware);

adminFeedback.command("admin_feedback", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("📋 List Feedback", ADMIN_FEEDBACK_CALLBACKS.LIST)
        .text("👁 View", ADMIN_FEEDBACK_CALLBACKS.VIEW);

    await ctx.reply("💬 <b>Feedback Management</b>\n\nSelect an operation:", {
        parse_mode: "HTML",
        reply_markup: keyboard
    });
});

adminFeedback.callbackQuery(ADMIN_FEEDBACK_CALLBACKS.LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_FEEDBACK_LIST);
});

adminFeedback.callbackQuery(ADMIN_FEEDBACK_CALLBACKS.VIEW, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_FEEDBACK_VIEW);
});

export async function adminFeedbackListConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    const keyboard = new InlineKeyboard()
        .text("📋 All Feedback", FEEDBACK_FILTERS.ALL)
        .text("👤 By User", FEEDBACK_FILTERS.USER).row()
        .text("📅 By Date Range", FEEDBACK_FILTERS.DATE);

    await ctx.reply("💬 Filter feedback by:", {reply_markup: keyboard});

    const choiceCtx = await conversation.wait();
    
    if (choiceCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const choice = choiceCtx.callbackQuery?.data || choiceCtx.message?.text;
    
    if (choiceCtx.callbackQuery) {
        await choiceCtx.answerCallbackQuery();
    }

    try {
        let feedbacks;

        switch (choice) {
            case FEEDBACK_FILTERS.ALL:
                feedbacks = await prisma.feedback.findMany({
                    take: 20,
                    orderBy: {createdAt: 'desc'},
                    include: {user: true}
                });
                break;

            case FEEDBACK_FILTERS.USER:
                await ctx.reply("Enter User ID:");
                const userIdCtx = await conversation.wait();
                if (userIdCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const userId = parseInt(userIdCtx.message?.text || "");
                if (isNaN(userId)) {
                    await ctx.reply("❌ Invalid User ID.");
                    return;
                }
                feedbacks = await prisma.feedback.findMany({
                    where: {userId},
                    orderBy: {createdAt: 'desc'},
                    include: {user: true}
                });
                break;

            case FEEDBACK_FILTERS.DATE:
                await ctx.reply("Enter start date (YYYY-MM-DD):");
                const startDateCtx = await conversation.wait();
                if (startDateCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const startDate = new Date(startDateCtx.message?.text || "");
                if (isNaN(startDate.getTime())) {
                    await ctx.reply("❌ Invalid start date format.");
                    return;
                }

                await ctx.reply("Enter end date (YYYY-MM-DD):");
                const endDateCtx = await conversation.wait();
                if (endDateCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const endDate = new Date(endDateCtx.message?.text || "");
                if (isNaN(endDate.getTime())) {
                    await ctx.reply("❌ Invalid end date format.");
                    return;
                }
                endDate.setHours(23, 59, 59, 999); // Include full end date

                feedbacks = await prisma.feedback.findMany({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: {createdAt: 'desc'},
                    include: {user: true}
                });
                break;

            default:
                await ctx.reply("❌ Invalid choice.");
                return;
        }

        if (feedbacks.length === 0) {
            await ctx.reply("📋 No feedback found matching your criteria.");
            return;
        }

        let message = "💬 <b>Feedback List</b>";
        if (choice === FEEDBACK_FILTERS.ALL) {
            message += " (showing first 20)";
        }
        message += ":\n\n";

        for (const feedback of feedbacks) {
            const preview = feedback.message.substring(0, 100) + (feedback.message.length > 100 ? '...' : '');
            
            message += `<b>ID:</b> <code>${feedback.id}</code>\n`;
            message += `<b>User:</b> ${feedback.user.firstName || ''} ${feedback.user.lastName || ''} (ID: ${feedback.userId})\n`;
            message += `<b>Username:</b> @${feedback.userName || feedback.user.username || 'N/A'}\n`;
            message += `<b>Date:</b> ${feedback.createdAt.toLocaleString()}\n`;
            message += `<b>Preview:</b> "${preview}"\n`;
            message += `─────────────────\n\n`;
        }

        message += `\nℹ️ Use /admin_feedback to view full message content.`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error listing feedback:", error);
        await ctx.reply("❌ Failed to retrieve feedback list.");
    }
}

export async function adminFeedbackViewConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("💬 Enter the Feedback ID to view full details:\n\nType /cancel to abort.");

    const feedbackIdCtx = await conversation.wait();
    if (feedbackIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const feedbackId = parseInt(feedbackIdCtx.message?.text || "");
    if (isNaN(feedbackId)) {
        await ctx.reply("❌ Invalid Feedback ID.");
        return;
    }

    try {
        const feedback = await prisma.feedback.findUnique({
            where: {id: feedbackId},
            include: {
                user: {
                    include: {
                        subscriptions: {
                            where: {isActive: true},
                            include: {group: true}
                        }
                    }
                }
            }
        });

        if (!feedback) {
            await ctx.reply(`❌ Feedback with ID ${feedbackId} not found.`);
            return;
        }

        let message = `💬 <b>Feedback Details</b>\n\n`;
        message += `<b>Feedback ID:</b> <code>${feedback.id}</code>\n`;
        message += `<b>Submitted:</b> ${feedback.createdAt.toLocaleString()}\n\n`;
        
        message += `<b>User Information:</b>\n`;
        message += `  ID: ${feedback.userId}\n`;
        message += `  Name: ${feedback.user.firstName || ''} ${feedback.user.lastName || 'N/A'}\n`;
        message += `  Username: @${feedback.userName || feedback.user.username || 'N/A'}\n`;
        message += `  Telegram ID: <code>${feedback.telegramId}</code>\n`;
        message += `  Language: ${feedback.languageCode || feedback.user.languageCode || 'N/A'}\n`;
        
        if (feedback.user.subscriptions.length > 0) {
            message += `  Active Subscriptions (${feedback.user.subscriptions.length}):\n`;
            for (const sub of feedback.user.subscriptions) {
                message += `    • ${sub.typeOfSubscription} - ${sub.group.name}\n`;
            }
        } else {
            message += `  Active Subscriptions: None\n`;
        }
        
        message += `\n<b>Message:</b>\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `${feedback.message}\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error viewing feedback:", error);
        await ctx.reply("❌ Failed to retrieve feedback details.");
    }
}
