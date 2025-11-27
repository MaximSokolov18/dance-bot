import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot";
import {adminMiddleware} from "./middleware";
import prisma from "../db";
import type {Conversation} from "@grammyjs/conversations";
import {DanceType, Weekday} from "@prisma/client";
import {GroupNameFormatMap} from "../constants";
import {ADMIN_GROUP_CALLBACKS, ADMIN_CLASS_DAY_CALLBACKS, CONVERSATION_NAMES} from "./constants";

export const adminGroups = new Composer<MyContext>();
adminGroups.use(adminMiddleware);

adminGroups.command("admin_group", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("📋 List Groups", ADMIN_GROUP_CALLBACKS.LIST)
        .text("👁 View", ADMIN_GROUP_CALLBACKS.VIEW).row()
        .text("➕ Create Group", ADMIN_GROUP_CALLBACKS.CREATE)
        .text("✏️ Update", ADMIN_GROUP_CALLBACKS.UPDATE).row()
        .text("🗑 Delete Group", ADMIN_GROUP_CALLBACKS.DELETE).row()
        .text("📅 Add Class Day", ADMIN_CLASS_DAY_CALLBACKS.ADD)
        .text("❌ Delete Class Day", ADMIN_CLASS_DAY_CALLBACKS.DELETE);

    await ctx.reply("🎭 <b>Group Management</b>\n\nSelect an operation:", {
        parse_mode: "HTML",
        reply_markup: keyboard
    });
});

adminGroups.callbackQuery(ADMIN_GROUP_CALLBACKS.LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await listGroups(ctx);
});

adminGroups.callbackQuery(ADMIN_GROUP_CALLBACKS.VIEW, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_GROUP_VIEW);
});

adminGroups.callbackQuery(ADMIN_GROUP_CALLBACKS.CREATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_GROUP_CREATE);
});

adminGroups.callbackQuery(ADMIN_GROUP_CALLBACKS.UPDATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_GROUP_UPDATE);
});

adminGroups.callbackQuery(ADMIN_GROUP_CALLBACKS.DELETE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_GROUP_DELETE);
});

adminGroups.callbackQuery(ADMIN_CLASS_DAY_CALLBACKS.ADD, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_CLASS_DAY_ADD);
});

adminGroups.callbackQuery(ADMIN_CLASS_DAY_CALLBACKS.DELETE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_CLASS_DAY_DELETE);
});

async function listGroups(ctx: MyContext) {
    try {
        const groups = await prisma.group.findMany({
            include: {
                classDays: {orderBy: {weekday: 'asc'}},
                subscriptions: {where: {isActive: true}}
            },
            orderBy: {createdAt: 'desc'}
        });

        if (groups.length === 0) {
            await ctx.reply("📋 No groups found in the database.");
            return;
        }

        let message = "🎭 <b>Dance Groups List</b>:\n\n";

        for (const group of groups) {
            message += `<b>ID:</b> <code>${group.id}</code>\n`;
            message += `<b>Name:</b> ${GroupNameFormatMap[group.name]}\n`;
            message += `<b>Class Days:</b>\n`;
            if (group.classDays.length === 0) {
                message += `  No class days scheduled\n`;
            } else {
                for (const cd of group.classDays) {
                    message += `  • ${cd.weekday} at ${cd.time} (ID: ${cd.id})\n`;
                }
            }
            message += `<b>Active Subscriptions:</b> ${group.subscriptions.length}\n`;
            message += `<b>Created:</b> ${group.createdAt.toLocaleDateString()}\n`;
            message += `─────────────────\n\n`;
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error listing groups:", error);
        await ctx.reply("❌ Failed to retrieve groups list.");
    }
}

export async function adminGroupViewConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🎭 Enter the Group ID to view details:\n\nType /cancel to abort.");

    const groupIdCtx = await conversation.wait();
    if (groupIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const groupId = parseInt(groupIdCtx.message?.text || "");
    if (isNaN(groupId)) {
        await ctx.reply("❌ Invalid Group ID.");
        return;
    }

    try {
        const group = await prisma.group.findUnique({
            where: {id: groupId},
            include: {
                classDays: {orderBy: {weekday: 'asc'}},
                subscriptions: {
                    include: {user: true},
                    orderBy: {createdAt: 'desc'}
                }
            }
        });

        if (!group) {
            await ctx.reply(`❌ Group with ID ${groupId} not found.`);
            return;
        }

        let message = `🎭 <b>Group Details</b>\n\n`;
        message += `<b>ID:</b> <code>${group.id}</code>\n`;
        message += `<b>Name:</b> ${GroupNameFormatMap[group.name]}\n`;
        message += `<b>Created:</b> ${group.createdAt.toLocaleString()}\n`;
        message += `<b>Updated:</b> ${group.updatedAt.toLocaleString()}\n\n`;

        message += `📅 <b>Class Schedule (${group.classDays.length}):</b>\n`;
        if (group.classDays.length === 0) {
            message += `  No class days scheduled\n`;
        } else {
            for (const cd of group.classDays) {
                message += `  • <b>${cd.weekday}</b> at ${cd.time} (ClassDay ID: ${cd.id})\n`;
            }
        }

        message += `\n👥 <b>Subscriptions (${group.subscriptions.length}):</b>\n`;
        const activeCount = group.subscriptions.filter(s => s.isActive).length;
        message += `  Active: ${activeCount} | Inactive: ${group.subscriptions.length - activeCount}\n`;
        
        if (group.subscriptions.length > 0) {
            message += `\n<b>Recent subscriptions:</b>\n`;
            for (const sub of group.subscriptions.slice(0, 5)) {
                message += `  • ${sub.user.firstName || ''} ${sub.user.lastName || ''} - ${sub.typeOfSubscription} ${sub.isActive ? '✅' : '❌'}\n`;
            }
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error viewing group:", error);
        await ctx.reply("❌ Failed to retrieve group details.");
    }
}

export async function adminGroupCreateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("➕ <b>Create New Group</b>\n\nSelect Dance Type:\n\n1 - Jazz Funk\n2 - High Heels\n\nEnter choice (1-2) or /cancel:", {parse_mode: "HTML"});

    const typeCtx = await conversation.wait();
    if (typeCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    let danceType: DanceType;
    switch (typeCtx.message?.text) {
        case "1":
            danceType = DanceType.JazzFunk;
            break;
        case "2":
            danceType = DanceType.HighHeels;
            break;
        default:
            await ctx.reply("❌ Invalid choice.");
            return;
    }

    const existingGroup = await prisma.group.findFirst({
        where: {name: danceType}
    });

    if (existingGroup) {
        await ctx.reply(`⚠️ Group for ${GroupNameFormatMap[danceType]} already exists (ID: ${existingGroup.id}).\nUse /admin_group ${existingGroup.id} to view it.`);
        return;
    }

    try {
        const group = await prisma.group.create({
            data: {name: danceType}
        });

        let message = `✅ <b>Group Created Successfully!</b>\n\n`;
        message += `<b>ID:</b> ${group.id}\n`;
        message += `<b>Name:</b> ${GroupNameFormatMap[group.name]}\n\n`;
        message += `ℹ️ Use /admin_group to add class schedule.`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error creating group:", error);
        await ctx.reply("❌ Failed to create group.");
    }
}

export async function adminGroupUpdateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("✏️ <b>Update Group</b>\n\nEnter Group ID:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const groupIdCtx = await conversation.wait();
    if (groupIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const groupId = parseInt(groupIdCtx.message?.text || "");
    if (isNaN(groupId)) {
        await ctx.reply("❌ Invalid Group ID.");
        return;
    }

    const group = await prisma.group.findUnique({where: {id: groupId}});
    if (!group) {
        await ctx.reply(`❌ Group with ID ${groupId} not found.`);
        return;
    }

    await ctx.reply(`Current group name: ${GroupNameFormatMap[group.name]}\n\nSelect new Dance Type:\n\n1 - Jazz Funk\n2 - High Heels\n\nEnter choice (1-2):`);

    const typeCtx = await conversation.wait();
    if (typeCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    let danceType: DanceType;
    switch (typeCtx.message?.text) {
        case "1":
            danceType = DanceType.JazzFunk;
            break;
        case "2":
            danceType = DanceType.HighHeels;
            break;
        default:
            await ctx.reply("❌ Invalid choice.");
            return;
    }

    try {
        const updated = await prisma.group.update({
            where: {id: groupId},
            data: {name: danceType}
        });

        await ctx.reply(`✅ Group updated to ${GroupNameFormatMap[updated.name]}!`);
    } catch (error) {
        console.error("Error updating group:", error);
        await ctx.reply("❌ Failed to update group.");
    }
}

export async function adminGroupDeleteConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🗑 <b>Delete Group</b>\n\n⚠️ WARNING: This will permanently delete the group and CASCADE DELETE all class days.\nSubscriptions will remain but reference a non-existent group.\n\nEnter Group ID to delete:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const groupIdCtx = await conversation.wait();
    if (groupIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const groupId = parseInt(groupIdCtx.message?.text || "");
    if (isNaN(groupId)) {
        await ctx.reply("❌ Invalid Group ID.");
        return;
    }

    const group = await prisma.group.findUnique({
        where: {id: groupId},
        include: {
            classDays: true,
            subscriptions: true
        }
    });

    if (!group) {
        await ctx.reply(`❌ Group with ID ${groupId} not found.`);
        return;
    }

    let confirmMessage = `⚠️ <b>Confirm Deletion</b>\n\n`;
    confirmMessage += `Group: ${GroupNameFormatMap[group.name]} (ID: ${group.id})\n`;
    confirmMessage += `Class Days: ${group.classDays.length} (will be deleted)\n`;
    confirmMessage += `Subscriptions: ${group.subscriptions.length} (will be orphaned)\n\n`;
    confirmMessage += `Type <b>DELETE</b> to confirm or /cancel to abort:`;

    await ctx.reply(confirmMessage, {parse_mode: "HTML"});

    const confirmCtx = await conversation.wait();
    if (confirmCtx.message?.text !== "DELETE") {
        await ctx.reply("❌ Deletion cancelled. Confirmation text did not match.");
        return;
    }

    try {
        await prisma.group.delete({where: {id: groupId}});
        await ctx.reply(`✅ Group ${groupId} and ${group.classDays.length} class days deleted successfully.`);
    } catch (error) {
        console.error("Error deleting group:", error);
        await ctx.reply("❌ Failed to delete group. Check console for details.");
    }
}

export async function adminClassDayAddConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("➕ <b>Add Class Day</b>\n\nEnter Group ID:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const groupIdCtx = await conversation.wait();
    if (groupIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const groupId = parseInt(groupIdCtx.message?.text || "");
    if (isNaN(groupId)) {
        await ctx.reply("❌ Invalid Group ID.");
        return;
    }

    const group = await prisma.group.findUnique({
        where: {id: groupId},
        include: {classDays: true}
    });

    if (!group) {
        await ctx.reply(`❌ Group with ID ${groupId} not found.`);
        return;
    }

    await ctx.reply(`Group: ${GroupNameFormatMap[group.name]}\n\nSelect Weekday:\n\n1 - Monday\n2 - Tuesday\n3 - Wednesday\n4 - Thursday\n5 - Friday\n6 - Saturday\n7 - Sunday\n\nEnter choice (1-7):`);

    const weekdayCtx = await conversation.wait();
    if (weekdayCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    let weekday: Weekday;
    switch (weekdayCtx.message?.text) {
        case "1":
            weekday = Weekday.Monday;
            break;
        case "2":
            weekday = Weekday.Tuesday;
            break;
        case "3":
            weekday = Weekday.Wednesday;
            break;
        case "4":
            weekday = Weekday.Thursday;
            break;
        case "5":
            weekday = Weekday.Friday;
            break;
        case "6":
            weekday = Weekday.Saturday;
            break;
        case "7":
            weekday = Weekday.Sunday;
            break;
        default:
            await ctx.reply("❌ Invalid choice.");
            return;
    }

    await ctx.reply("Enter class time (HH:MM format, e.g., 17:00):");

    const timeCtx = await conversation.wait();
    if (timeCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const time = timeCtx.message?.text || "";
    
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
        await ctx.reply("❌ Invalid time format. Use HH:MM (e.g., 17:00).");
        return;
    }

    const existingClassDay = group.classDays.find(cd => cd.weekday === weekday && cd.time === time);
    if (existingClassDay) {
        await ctx.reply(`⚠️ Class day already exists: ${weekday} at ${time} (ID: ${existingClassDay.id})`);
        return;
    }

    try {
        const classDay = await prisma.classDay.create({
            data: {
                groupId,
                weekday,
                time
            }
        });

        let message = `✅ <b>Class Day Added Successfully!</b>\n\n`;
        message += `<b>ID:</b> ${classDay.id}\n`;
        message += `<b>Group:</b> ${GroupNameFormatMap[group.name]}\n`;
        message += `<b>Weekday:</b> ${classDay.weekday}\n`;
        message += `<b>Time:</b> ${classDay.time}\n`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error adding class day:", error);
        await ctx.reply("❌ Failed to add class day.");
    }
}

export async function adminClassDayDeleteConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🗑 <b>Delete Class Day</b>\n\nEnter ClassDay ID to delete:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const classDayIdCtx = await conversation.wait();
    if (classDayIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const classDayId = parseInt(classDayIdCtx.message?.text || "");
    if (isNaN(classDayId)) {
        await ctx.reply("❌ Invalid ClassDay ID.");
        return;
    }

    const classDay = await prisma.classDay.findUnique({
        where: {id: classDayId},
        include: {group: true}
    });

    if (!classDay) {
        await ctx.reply(`❌ ClassDay with ID ${classDayId} not found.`);
        return;
    }

    let confirmMessage = `⚠️ <b>Confirm Deletion</b>\n\n`;
    confirmMessage += `ClassDay ID: ${classDay.id}\n`;
    confirmMessage += `Group: ${GroupNameFormatMap[classDay.group.name]}\n`;
    confirmMessage += `Schedule: ${classDay.weekday} at ${classDay.time}\n\n`;
    confirmMessage += `Type <b>DELETE</b> to confirm or /cancel to abort:`;

    await ctx.reply(confirmMessage, {parse_mode: "HTML"});

    const confirmCtx = await conversation.wait();
    if (confirmCtx.message?.text !== "DELETE") {
        await ctx.reply("❌ Deletion cancelled. Confirmation text did not match.");
        return;
    }

    try {
        await prisma.classDay.delete({where: {id: classDayId}});
        await ctx.reply(`✅ ClassDay ${classDayId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting class day:", error);
        await ctx.reply("❌ Failed to delete class day. Check console for details.");
    }
}
