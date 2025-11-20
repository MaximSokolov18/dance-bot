import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot.js";
import {adminMiddleware} from "./middleware.js";
import prisma from "../db.js";
import type {Conversation} from "@grammyjs/conversations";
import {ADMIN_HOLIDAY_CALLBACKS, CONVERSATION_NAMES} from "./constants.js";

export const adminHolidays = new Composer<MyContext>();
adminHolidays.use(adminMiddleware);

adminHolidays.command("admin_holiday", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("📋 List Holidays", ADMIN_HOLIDAY_CALLBACKS.LIST)
        .text("👁 View", ADMIN_HOLIDAY_CALLBACKS.VIEW).row()
        .text("➕ Create", ADMIN_HOLIDAY_CALLBACKS.CREATE)
        .text("✏️ Update", ADMIN_HOLIDAY_CALLBACKS.UPDATE).row()
        .text("🗑 Delete", ADMIN_HOLIDAY_CALLBACKS.DELETE);

    await ctx.reply("🎉 <b>Holiday Management</b>\n\nSelect an operation:", {
        parse_mode: "HTML",
        reply_markup: keyboard
    });
});

adminHolidays.callbackQuery(ADMIN_HOLIDAY_CALLBACKS.LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await listHolidays(ctx);
});

adminHolidays.callbackQuery(ADMIN_HOLIDAY_CALLBACKS.VIEW, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_HOLIDAY_VIEW);
});

adminHolidays.callbackQuery(ADMIN_HOLIDAY_CALLBACKS.CREATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_HOLIDAY_CREATE);
});

adminHolidays.callbackQuery(ADMIN_HOLIDAY_CALLBACKS.UPDATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_HOLIDAY_UPDATE);
});

adminHolidays.callbackQuery(ADMIN_HOLIDAY_CALLBACKS.DELETE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_HOLIDAY_DELETE);
});

async function listHolidays(ctx: MyContext) {
    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: {date: 'asc'}
        });

        if (holidays.length === 0) {
            await ctx.reply("📋 No holidays found in the database.");
            return;
        }

        let message = "🎉 <b>Holidays List</b>:\n\n";

        for (const holiday of holidays) {
            message += `<b>ID:</b> <code>${holiday.id}</code>\n`;
            message += `<b>Name:</b> ${holiday.name}\n`;
            message += `<b>Date:</b> ${holiday.date.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}\n`;
            if (holiday.description) {
                message += `<b>Description:</b> ${holiday.description}\n`;
            }
            message += `<b>Created:</b> ${holiday.createdAt.toLocaleDateString()}\n`;
            message += `─────────────────\n\n`;
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error listing holidays:", error);
        await ctx.reply("❌ Failed to retrieve holidays list.");
    }
}

export async function adminHolidayViewConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🎉 Enter the Holiday ID to view details:\n\nType /cancel to abort.");

    const holidayIdCtx = await conversation.wait();
    if (holidayIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const holidayId = parseInt(holidayIdCtx.message?.text || "");
    if (isNaN(holidayId)) {
        await ctx.reply("❌ Invalid Holiday ID.");
        return;
    }

    try {
        const holiday = await prisma.holiday.findUnique({
            where: {id: holidayId}
        });

        if (!holiday) {
            await ctx.reply(`❌ Holiday with ID ${holidayId} not found.`);
            return;
        }

        let message = `🎉 <b>Holiday Details</b>\n\n`;
        message += `<b>ID:</b> <code>${holiday.id}</code>\n`;
        message += `<b>Name:</b> ${holiday.name}\n`;
        message += `<b>Date:</b> ${holiday.date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}\n`;
        message += `<b>Day of Week:</b> ${holiday.date.toLocaleDateString('en-US', {weekday: 'long'})}\n`;
        if (holiday.description) {
            message += `<b>Description:</b> ${holiday.description}\n`;
        }
        message += `<b>Created:</b> ${holiday.createdAt.toLocaleString()}\n`;
        message += `<b>Updated:</b> ${holiday.updatedAt.toLocaleString()}\n`;

        message += `\nℹ️ <i>This holiday affects lesson calculations. Classes on this day are not counted toward subscription usage.</i>`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error viewing holiday:", error);
        await ctx.reply("❌ Failed to retrieve holiday details.");
    }
}

export async function adminHolidayCreateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("➕ <b>Create New Holiday</b>\n\nEnter holiday name:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const nameCtx = await conversation.wait();
    if (nameCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const name = nameCtx.message?.text || "";
    if (name.trim().length === 0) {
        await ctx.reply("❌ Holiday name cannot be empty.");
        return;
    }

    await ctx.reply("Enter holiday date (YYYY-MM-DD):");

    const dateCtx = await conversation.wait();
    if (dateCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const dateStr = dateCtx.message?.text || "";
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
        await ctx.reply("❌ Invalid date format. Use YYYY-MM-DD (e.g., 2025-12-25).");
        return;
    }

    const existingHoliday = await prisma.holiday.findFirst({
        where: {
            date: {
                gte: new Date(date.setHours(0, 0, 0, 0)),
                lt: new Date(date.setHours(23, 59, 59, 999))
            }
        }
    });

    if (existingHoliday) {
        await ctx.reply(`⚠️ A holiday already exists on ${dateStr}:\n"${existingHoliday.name}" (ID: ${existingHoliday.id})`);
        return;
    }

    await ctx.reply("Enter description (or type 'skip'):");

    const descCtx = await conversation.wait();
    if (descCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const description = descCtx.message?.text === "skip" ? null : descCtx.message?.text || null;

    try {
        const holiday = await prisma.holiday.create({
            data: {
                name,
                date: new Date(dateStr),
                description
            }
        });

        let message = `✅ <b>Holiday Created Successfully!</b>\n\n`;
        message += `<b>ID:</b> ${holiday.id}\n`;
        message += `<b>Name:</b> ${holiday.name}\n`;
        message += `<b>Date:</b> ${holiday.date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}\n`;
        if (holiday.description) {
            message += `<b>Description:</b> ${holiday.description}\n`;
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error creating holiday:", error);
        await ctx.reply("❌ Failed to create holiday.");
    }
}

export async function adminHolidayUpdateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("✏️ <b>Update Holiday</b>\n\nEnter Holiday ID:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const holidayIdCtx = await conversation.wait();
    if (holidayIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const holidayId = parseInt(holidayIdCtx.message?.text || "");
    if (isNaN(holidayId)) {
        await ctx.reply("❌ Invalid Holiday ID.");
        return;
    }

    const holiday = await prisma.holiday.findUnique({where: {id: holidayId}});
    if (!holiday) {
        await ctx.reply(`❌ Holiday with ID ${holidayId} not found.`);
        return;
    }

    let message = `Current holiday data:\n`;
    message += `Name: ${holiday.name}\n`;
    message += `Date: ${holiday.date.toLocaleDateString()}\n`;
    message += `Description: ${holiday.description || 'None'}\n\n`;
    message += `What would you like to update?\n`;
    message += `1 - Name\n`;
    message += `2 - Date\n`;
    message += `3 - Description\n`;
    message += `\nEnter choice (1-3):`;

    await ctx.reply(message);

    const choiceCtx = await conversation.wait();
    if (choiceCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const choice = choiceCtx.message?.text;

    try {
        switch (choice) {
            case "1":
                await ctx.reply("Enter new name:");
                const nameCtx = await conversation.wait();
                if (nameCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newName = nameCtx.message?.text || "";
                if (newName.trim().length === 0) {
                    await ctx.reply("❌ Name cannot be empty.");
                    return;
                }
                await prisma.holiday.update({
                    where: {id: holidayId},
                    data: {name: newName}
                });
                await ctx.reply(`✅ Name updated to "${newName}"!`);
                break;

            case "2":
                await ctx.reply("Enter new date (YYYY-MM-DD):");
                const dateCtx = await conversation.wait();
                if (dateCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newDate = new Date(dateCtx.message?.text || "");
                if (isNaN(newDate.getTime())) {
                    await ctx.reply("❌ Invalid date format.");
                    return;
                }
                await prisma.holiday.update({
                    where: {id: holidayId},
                    data: {date: newDate}
                });
                await ctx.reply(`✅ Date updated to ${newDate.toLocaleDateString()}!`);
                break;

            case "3":
                await ctx.reply("Enter new description (or 'clear' to remove):");
                const descCtx = await conversation.wait();
                if (descCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newDesc = descCtx.message?.text === "clear" ? null : descCtx.message?.text || null;
                await prisma.holiday.update({
                    where: {id: holidayId},
                    data: {description: newDesc}
                });
                await ctx.reply(newDesc ? `✅ Description updated!` : `✅ Description cleared!`);
                break;

            default:
                await ctx.reply("❌ Invalid choice.");
        }
    } catch (error) {
        console.error("Error updating holiday:", error);
        await ctx.reply("❌ Failed to update holiday.");
    }
}

export async function adminHolidayDeleteConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🗑 <b>Delete Holiday</b>\n\nℹ️ This will affect lesson calculations for subscriptions.\n\nEnter Holiday ID to delete:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const holidayIdCtx = await conversation.wait();
    if (holidayIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const holidayId = parseInt(holidayIdCtx.message?.text || "");
    if (isNaN(holidayId)) {
        await ctx.reply("❌ Invalid Holiday ID.");
        return;
    }

    const holiday = await prisma.holiday.findUnique({where: {id: holidayId}});
    if (!holiday) {
        await ctx.reply(`❌ Holiday with ID ${holidayId} not found.`);
        return;
    }

    let confirmMessage = `⚠️ <b>Confirm Deletion</b>\n\n`;
    confirmMessage += `Holiday: ${holiday.name}\n`;
    confirmMessage += `Date: ${holiday.date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}\n`;
    if (holiday.description) {
        confirmMessage += `Description: ${holiday.description}\n`;
    }
    confirmMessage += `\n⚠️ This will affect subscription lesson calculations.\n\n`;
    confirmMessage += `Type <b>DELETE</b> to confirm or /cancel to abort:`;

    await ctx.reply(confirmMessage, {parse_mode: "HTML"});

    const confirmCtx = await conversation.wait();
    if (confirmCtx.message?.text !== "DELETE") {
        await ctx.reply("❌ Deletion cancelled. Confirmation text did not match.");
        return;
    }

    try {
        await prisma.holiday.delete({where: {id: holidayId}});
        await ctx.reply(`✅ Holiday "${holiday.name}" deleted successfully.`);
    } catch (error) {
        console.error("Error deleting holiday:", error);
        await ctx.reply("❌ Failed to delete holiday. Check console for details.");
    }
}
