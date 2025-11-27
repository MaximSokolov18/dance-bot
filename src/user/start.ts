import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot";
import prisma from "../db";
import {ADMIN_SUBSCRIPTION_CALLBACKS} from "../admin/constants";

export const start = new Composer<MyContext>();

start.command("start", async (ctx) => {
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

            // Notify admin about new user registration
            if (process.env.ADMIN_TELEGRAM_ID) {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
                const usernameDisplay = user.username ? `@${user.username}` : 'N/A';
                const registrationDate = user.createdAt.toLocaleString();

                const notificationMessage = 
                    `🆕 <b>New User Registered!</b>\n\n` +
                    `<b>Database ID:</b> <code>${user.id}</code>\n` +
                    `<b>Full Name:</b> ${fullName}\n` +
                    `<b>Username:</b> ${usernameDisplay}\n` +
                    `<b>Registration Date:</b> ${registrationDate}\n\n` +
                    `💡 Use Database ID: <code>${user.id}</code> to create subscription`;

                const keyboard = new InlineKeyboard()
                    .text("➕ Create Subscription", ADMIN_SUBSCRIPTION_CALLBACKS.CREATE);

                try {
                    await ctx.api.sendMessage(process.env.ADMIN_TELEGRAM_ID, notificationMessage, {
                        parse_mode: "HTML",
                        reply_markup: keyboard
                    });
                    console.log(`New user registration notification sent to admin ${process.env.ADMIN_TELEGRAM_ID}`);
                } catch (error) {
                    console.error(`Failed to send new user notification to admin ${process.env.ADMIN_TELEGRAM_ID}:`, error);
                }
            }
        }

        await ctx.reply(`Welcome ${first_name || "there"}!`);
    } catch (error) {
        console.error("Error in /start command:", error);
        await ctx.reply("❌ Sorry, something went wrong. Please try again later.");
    }
});
