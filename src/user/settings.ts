import {Composer, InlineKeyboard} from "grammy/web";
import prisma from "../db";
import {updateNotificationSchedule, translate} from '../utils';
import type {MyContext} from "../bot";

export const settings = new Composer<MyContext>();

const SETTINGS_CALLBACKS = {
    NOTIFICATIONS_ON: "settings_notify_on",
    NOTIFICATIONS_OFF: "settings_notify_off",
    LANG_EN: "settings_lang_en",
    LANG_ES: "settings_lang_es",
    LANG_UK: "settings_lang_uk",
};

settings.command("settings", async (ctx) => {
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.reply(ctx.t("common-user-not-found"));
        return;
    }

    const keyboard = new InlineKeyboard();
    
    if (user.allowNotifications) {
        keyboard.text(ctx.t("settings-btn-notify-off"), SETTINGS_CALLBACKS.NOTIFICATIONS_OFF);
    } else {
        keyboard.text(ctx.t("settings-btn-notify-on"), SETTINGS_CALLBACKS.NOTIFICATIONS_ON);
    }
    keyboard.row();
    
    keyboard.text(ctx.t("settings-btn-lang-en"), SETTINGS_CALLBACKS.LANG_EN);
    keyboard.text(ctx.t("settings-btn-lang-es"), SETTINGS_CALLBACKS.LANG_ES);
    keyboard.text(ctx.t("settings-btn-lang-uk"), SETTINGS_CALLBACKS.LANG_UK);

    const notificationStatus = user.allowNotifications 
        ? ctx.t("settings-notify-enabled") 
        : ctx.t("settings-notify-disabled");
    
    const languageName = user.languageCode === "es" ? "Español" : user.languageCode === "uk" ? "Українська" : "English";

    await ctx.reply(
        ctx.t("settings-title") + "\n\n" +
        ctx.t("settings-section-notifications", { status: notificationStatus }) + "\n\n" +
        ctx.t("settings-section-language", { language: languageName }),
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
        await ctx.editMessageText(ctx.t("common-user-not-found"));
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
        .text(ctx.t("settings-btn-notify-off"), SETTINGS_CALLBACKS.NOTIFICATIONS_OFF)
        .row()
        .text(ctx.t("settings-btn-lang-en"), SETTINGS_CALLBACKS.LANG_EN)
        .text(ctx.t("settings-btn-lang-es"), SETTINGS_CALLBACKS.LANG_ES)
        .text(ctx.t("settings-btn-lang-uk"), SETTINGS_CALLBACKS.LANG_UK);

    const languageName = user.languageCode === "es" ? "Español" : user.languageCode === "uk" ? "Українська" : "English";

    await ctx.editMessageText(
        ctx.t("settings-title") + "\n\n" +
        ctx.t("settings-section-notifications", { status: ctx.t("settings-notify-enabled") }) + "\n\n" +
        ctx.t("settings-section-language", { language: languageName }),
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
        await ctx.editMessageText(ctx.t("common-user-not-found"));
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
        .text(ctx.t("settings-btn-notify-on"), SETTINGS_CALLBACKS.NOTIFICATIONS_ON)
        .row()
        .text(ctx.t("settings-btn-lang-en"), SETTINGS_CALLBACKS.LANG_EN)
        .text(ctx.t("settings-btn-lang-es"), SETTINGS_CALLBACKS.LANG_ES)
        .text(ctx.t("settings-btn-lang-uk"), SETTINGS_CALLBACKS.LANG_UK);

    const languageName = user.languageCode === "es" ? "Español" : user.languageCode === "uk" ? "Українська" : "English";

    await ctx.editMessageText(
        ctx.t("settings-title") + "\n\n" +
        ctx.t("settings-section-notifications", { status: ctx.t("settings-notify-disabled") }) + "\n\n" +
        ctx.t("settings-section-language", { language: languageName }),
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});

settings.callbackQuery(SETTINGS_CALLBACKS.LANG_EN, async (ctx) => {
    await ctx.answerCallbackQuery();
    
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.editMessageText(ctx.t("common-user-not-found"));
        return;
    }

    if (user.languageCode === "en") {
        return;
    }

    await prisma.user.update({
        where: {id: user.id},
        data: {languageCode: "en"}
    });

    const updatedUser = await prisma.user.findUnique({
        where: {id: user.id}
    });

    if (!updatedUser) return;

    const keyboard = new InlineKeyboard();
    
    if (updatedUser.allowNotifications) {
        keyboard.text(translate("en", "settings-btn-notify-off"), SETTINGS_CALLBACKS.NOTIFICATIONS_OFF);
    } else {
        keyboard.text(translate("en", "settings-btn-notify-on"), SETTINGS_CALLBACKS.NOTIFICATIONS_ON);
    }
    keyboard.row();
    keyboard.text(translate("en", "settings-btn-lang-en"), SETTINGS_CALLBACKS.LANG_EN);
    keyboard.text(translate("en", "settings-btn-lang-es"), SETTINGS_CALLBACKS.LANG_ES);
    keyboard.text(translate("en", "settings-btn-lang-uk"), SETTINGS_CALLBACKS.LANG_UK);

    const notificationStatus = updatedUser.allowNotifications 
        ? translate("en", "settings-notify-enabled") 
        : translate("en", "settings-notify-disabled");

    await ctx.editMessageText(
        translate("en", "settings-title") + "\n\n" +
        translate("en", "settings-section-notifications", { status: notificationStatus }) + "\n\n" +
        translate("en", "settings-section-language", { language: "English" }),
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});

settings.callbackQuery(SETTINGS_CALLBACKS.LANG_ES, async (ctx) => {
    await ctx.answerCallbackQuery();
    
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.editMessageText(ctx.t("common-user-not-found"));
        return;
    }

    if (user.languageCode === "es") {
        return;
    }

    await prisma.user.update({
        where: {id: user.id},
        data: {languageCode: "es"}
    });

    const updatedUser = await prisma.user.findUnique({
        where: {id: user.id}
    });

    if (!updatedUser) return;

    const keyboard = new InlineKeyboard();
    
    if (updatedUser.allowNotifications) {
        keyboard.text(translate("es", "settings-btn-notify-off"), SETTINGS_CALLBACKS.NOTIFICATIONS_OFF);
    } else {
        keyboard.text(translate("es", "settings-btn-notify-on"), SETTINGS_CALLBACKS.NOTIFICATIONS_ON);
    }
    keyboard.row();
    keyboard.text(translate("es", "settings-btn-lang-en"), SETTINGS_CALLBACKS.LANG_EN);
    keyboard.text(translate("es", "settings-btn-lang-es"), SETTINGS_CALLBACKS.LANG_ES);
    keyboard.text(translate("es", "settings-btn-lang-uk"), SETTINGS_CALLBACKS.LANG_UK);

    const notificationStatus = updatedUser.allowNotifications 
        ? translate("es", "settings-notify-enabled") 
        : translate("es", "settings-notify-disabled");

    await ctx.editMessageText(
        translate("es", "settings-title") + "\n\n" +
        translate("es", "settings-section-notifications", { status: notificationStatus }) + "\n\n" +
        translate("es", "settings-section-language", { language: "Español" }),
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});

settings.callbackQuery(SETTINGS_CALLBACKS.LANG_UK, async (ctx) => {
    await ctx.answerCallbackQuery();
    
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)}
    });

    if (!user) {
        await ctx.editMessageText(ctx.t("common-user-not-found"));
        return;
    }

    // If already Ukrainian, just acknowledge the callback
    if (user.languageCode === "uk") {
        return;
    }

    await prisma.user.update({
        where: {id: user.id},
        data: {languageCode: "uk"}
    });

    const updatedUser = await prisma.user.findUnique({
        where: {id: user.id}
    });

    if (!updatedUser) return;

    const keyboard = new InlineKeyboard();
    
    if (updatedUser.allowNotifications) {
        keyboard.text(translate("uk", "settings-btn-notify-off"), SETTINGS_CALLBACKS.NOTIFICATIONS_OFF);
    } else {
        keyboard.text(translate("uk", "settings-btn-notify-on"), SETTINGS_CALLBACKS.NOTIFICATIONS_ON);
    }
    keyboard.row();
    keyboard.text(translate("uk", "settings-btn-lang-en"), SETTINGS_CALLBACKS.LANG_EN);
    keyboard.text(translate("uk", "settings-btn-lang-es"), SETTINGS_CALLBACKS.LANG_ES);
    keyboard.text(translate("uk", "settings-btn-lang-uk"), SETTINGS_CALLBACKS.LANG_UK);

    const notificationStatus = updatedUser.allowNotifications 
        ? translate("uk", "settings-notify-enabled") 
        : translate("uk", "settings-notify-disabled");

    await ctx.editMessageText(
        translate("uk", "settings-title") + "\n\n" +
        translate("uk", "settings-section-notifications", { status: notificationStatus }) + "\n\n" +
        translate("uk", "settings-section-language", { language: "Українська" }),
        {
            parse_mode: "HTML",
            reply_markup: keyboard
        }
    );
});
