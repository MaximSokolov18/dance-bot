import {Composer, InlineKeyboard} from "grammy/web";
import prisma from "../db";
import {updateNotificationSchedule} from '../utils';

export const settings = new Composer();

const SETTINGS_CALLBACKS = {
    NOTIFICATIONS_ON: "settings_notify_on",
    NOTIFICATIONS_OFF: "settings_notify_off",
};

settings.command("settings", async (ctx) => {
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.reply("There is no user with this ID");
        return;
    }

    const keyboard = new InlineKeyboard();
    
    if (user.allowNotifications) {
        keyboard.text("🔕 Notify Off", SETTINGS_CALLBACKS.NOTIFICATIONS_OFF);
    } else {
        keyboard.text("🔔 Notify On", SETTINGS_CALLBACKS.NOTIFICATIONS_ON);
    }

    const statusEmoji = user.allowNotifications ? "✅" : "❌";
    const statusText = user.allowNotifications ? "Enabled" : "Disabled";

    await ctx.reply(
        `⚙️ <b>Settings</b>\n\n<b>Notifications:</b> ${statusEmoji} ${statusText}`,
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});

settings.callbackQuery(SETTINGS_CALLBACKS.NOTIFICATIONS_ON, async (ctx) => {
    await ctx.answerCallbackQuery();
    
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.editMessageText("There is no user with this ID");
        return;
    }

    await prisma.user.update({
        where: {id: user.id},
        data: {allowNotifications: true}
    });

    await updateNotificationSchedule(user.id);
    await prisma.notificationSchedule.upsert({
        where: { userId: user.id },
        update: { isEnabled: true },
        create: {
            userId: user.id,
            isEnabled: true
        }
    });

    const keyboard = new InlineKeyboard()
        .text("🔕 Notify Off", SETTINGS_CALLBACKS.NOTIFICATIONS_OFF);

    await ctx.editMessageText(
        "⚙️ <b>Settings</b>\n\n<b>Notifications:</b> ✅ Enabled\n\n💡 You'll receive a reminder about renewing your subscription at 11:00 AM on your training day",
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});

settings.callbackQuery(SETTINGS_CALLBACKS.NOTIFICATIONS_OFF, async (ctx) => {
    await ctx.answerCallbackQuery();
    
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.editMessageText("There is no user with this ID");
        return;
    }

    await prisma.user.update({
        where: {id: user.id},
        data: {allowNotifications: false}
    });

    await prisma.notificationSchedule.updateMany({
        where: { userId: user.id },
        data: { isEnabled: false }
    });

    const keyboard = new InlineKeyboard()
        .text("🔔 Notify On", SETTINGS_CALLBACKS.NOTIFICATIONS_ON);

    await ctx.editMessageText(
        "⚙️ <b>Settings</b>\n\n<b>Notifications:</b> ❌ Disabled",
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});
