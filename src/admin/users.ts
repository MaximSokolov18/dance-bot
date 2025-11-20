import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot";
import {adminMiddleware} from "./middleware";
import prisma from "../db";
import type {Conversation} from "@grammyjs/conversations";
import {ADMIN_USER_CALLBACKS, USER_UPDATE_FIELDS, CONVERSATION_NAMES} from "./constants";

export const adminUsers = new Composer<MyContext>();
adminUsers.use(adminMiddleware);

adminUsers.command("admin_user", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("📋 List Users", ADMIN_USER_CALLBACKS.LIST)
        .text("👤 View User", ADMIN_USER_CALLBACKS.VIEW).row()
        .text("➕ Create User", ADMIN_USER_CALLBACKS.CREATE)
        .text("✏️ Update User", ADMIN_USER_CALLBACKS.UPDATE).row()
        .text("🗑 Delete User", ADMIN_USER_CALLBACKS.DELETE);

    await ctx.reply(
        "👥 <b>User Management</b>\n\nSelect an operation:",
        {parse_mode: "HTML", reply_markup: keyboard}
    );
});

adminUsers.callbackQuery(ADMIN_USER_CALLBACKS.LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await listUsers(ctx);
});

adminUsers.callbackQuery(ADMIN_USER_CALLBACKS.VIEW, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_USER_VIEW);
});

adminUsers.callbackQuery(ADMIN_USER_CALLBACKS.CREATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_USER_CREATE);
});

adminUsers.callbackQuery(ADMIN_USER_CALLBACKS.UPDATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_USER_UPDATE);
});

adminUsers.callbackQuery(ADMIN_USER_CALLBACKS.DELETE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_USER_DELETE);
});

async function listUsers(ctx: MyContext) {
    try {
        const users = await prisma.user.findMany({
            take: 20,
            orderBy: {createdAt: 'desc'},
            include: {
                subscriptions: {
                    where: {isActive: true},
                    include: {group: true}
                }
            }
        });

        if (users.length === 0) {
            await ctx.reply("📋 No users found in the database.");
            return;
        }

        let message = "👥 <b>Users List</b> (showing first 20):\n\n";
        
        for (const user of users) {
            const activeSubs = user.subscriptions.length;
            message += `ID: <code>${user.id}</code>\n`;
            message += `Telegram ID: <code>${user.telegramId}</code>\n`;
            message += `Name: ${user.firstName || ''} ${user.lastName || ''}\n`;
            message += `Username: @${user.username || 'N/A'}\n`;
            message += `Active Subscriptions: ${activeSubs}\n`;
            message += `Notifications: ${user.allowNotifications ? '✅' : '❌'}\n`;
            message += `Created: ${user.createdAt.toLocaleDateString()}\n`;
            message += `─────────────────\n\n`;
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error listing users:", error);
        await ctx.reply("❌ Failed to retrieve users list.");
    }
}

export async function adminUserViewConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("👤 Enter the User ID to view details:\n\nType /cancel to abort.");
    
    const userIdCtx = await conversation.wait();
    
    if (userIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const userId = parseInt(userIdCtx.message?.text || "");
    
    if (isNaN(userId)) {
        await ctx.reply("❌ Invalid User ID. Please use /admin_user_view to try again.");
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: userId},
            include: {
                subscriptions: {
                    include: {group: {include: {classDays: true}}},
                    orderBy: {startDate: 'desc'}
                },
                feedbacks: {
                    orderBy: {createdAt: 'desc'},
                    take: 5
                },
                notificationSchedule: true
            }
        });

        if (!user) {
            await ctx.reply(`❌ User with ID ${userId} not found.`);
            return;
        }

        let message = `👤 <b>User Details</b>\n\n`;
        message += `<b>ID:</b> <code>${user.id}</code>\n`;
        message += `<b>Telegram ID:</b> <code>${user.telegramId}</code>\n`;
        message += `<b>Name:</b> ${user.firstName || ''} ${user.lastName || 'N/A'}\n`;
        message += `<b>Username:</b> @${user.username || 'N/A'}\n`;
        message += `<b>Language:</b> ${user.languageCode || 'N/A'}\n`;
        message += `<b>Notifications:</b> ${user.allowNotifications ? '✅ Enabled' : '❌ Disabled'}\n`;
        message += `<b>Created:</b> ${user.createdAt.toLocaleString()}\n`;
        message += `<b>Updated:</b> ${user.updatedAt.toLocaleString()}\n\n`;

        message += `📊 <b>Subscriptions (${user.subscriptions.length}):</b>\n`;
        if (user.subscriptions.length === 0) {
            message += `  No subscriptions\n`;
        } else {
            for (const sub of user.subscriptions) {
                message += `  • ID: ${sub.id} | ${sub.typeOfSubscription} | ${sub.isActive ? '✅ Active' : '❌ Inactive'}\n`;
                message += `    Group: ${sub.group.name} | Start: ${sub.startDate.toLocaleDateString()}\n`;
            }
        }

        message += `\n💬 <b>Recent Feedback (${user.feedbacks.length}):</b>\n`;
        if (user.feedbacks.length === 0) {
            message += `  No feedback submitted\n`;
        } else {
            for (const fb of user.feedbacks.slice(0, 3)) {
                const preview = fb.message.substring(0, 50) + (fb.message.length > 50 ? '...' : '');
                message += `  • ${fb.createdAt.toLocaleDateString()}: "${preview}"\n`;
            }
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error viewing user:", error);
        await ctx.reply("❌ Failed to retrieve user details.");
    }
}

export async function adminUserCreateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("➕ <b>Create New User</b>\n\nEnter Telegram ID:\n\nType /cancel to abort.", {parse_mode: "HTML"});
    
    const telegramIdCtx = await conversation.wait();
    if (telegramIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const telegramIdStr = telegramIdCtx.message?.text || "";
    let telegramId: bigint;
    
    try {
        telegramId = BigInt(telegramIdStr);
    } catch {
        await ctx.reply("❌ Invalid Telegram ID format. Must be a number.");
        return;
    }

    const existingUser = await prisma.user.findUnique({
        where: {telegramId}
    });

    if (existingUser) {
        await ctx.reply(`❌ User with Telegram ID ${telegramId} already exists (User ID: ${existingUser.id}).`);
        return;
    }

    await ctx.reply("Enter First Name (or type 'skip'):");
    const firstNameCtx = await conversation.wait();
    if (firstNameCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }
    const firstName = firstNameCtx.message?.text === "skip" ? null : firstNameCtx.message?.text || null;

    await ctx.reply("Enter Last Name (or type 'skip'):");
    const lastNameCtx = await conversation.wait();
    if (lastNameCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }
    const lastName = lastNameCtx.message?.text === "skip" ? null : lastNameCtx.message?.text || null;

    await ctx.reply("Enter Username (without @, or type 'skip'):");
    const usernameCtx = await conversation.wait();
    if (usernameCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }
    const username = usernameCtx.message?.text === "skip" ? null : usernameCtx.message?.text || null;

    await ctx.reply("Allow notifications? (yes/no):");
    const notifyCtx = await conversation.wait();
    if (notifyCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }
    const allowNotifications = notifyCtx.message?.text?.toLowerCase() === "yes";

    try {
        const user = await prisma.user.create({
            data: {
                telegramId,
                firstName,
                lastName,
                username,
                allowNotifications,
                languageCode: "en"
            }
        });

        let message = `✅ <b>User Created Successfully!</b>\n\n`;
        message += `<b>ID:</b> ${user.id}\n`;
        message += `<b>Telegram ID:</b> <code>${user.telegramId}</code>\n`;
        message += `<b>Name:</b> ${user.firstName || ''} ${user.lastName || 'N/A'}\n`;
        message += `<b>Username:</b> @${user.username || 'N/A'}\n`;
        message += `<b>Notifications:</b> ${user.allowNotifications ? '✅ Enabled' : '❌ Disabled'}\n`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error creating user:", error);
        await ctx.reply("❌ Failed to create user. Please try again.");
    }
}

export async function adminUserUpdateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("✏️ <b>Update User</b>\n\nEnter the User ID to update:\n\nType /cancel to abort.", {parse_mode: "HTML"});
    
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

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
        await ctx.reply(`❌ User with ID ${userId} not found.`);
        return;
    }

    let message = `Current user data:\n`;
    message += `Name: ${user.firstName || ''} ${user.lastName || 'N/A'}\n`;
    message += `Username: @${user.username || 'N/A'}\n`;
    message += `Notifications: ${user.allowNotifications ? 'Enabled' : 'Disabled'}\n\n`;

    const keyboard = new InlineKeyboard()
        .text("First Name", USER_UPDATE_FIELDS.FIRST_NAME)
        .text("Last Name", USER_UPDATE_FIELDS.LAST_NAME).row()
        .text("Username", USER_UPDATE_FIELDS.USERNAME)
        .text("Toggle Notifications", USER_UPDATE_FIELDS.NOTIFICATIONS);

    await ctx.reply(message + `Select field to update:`, {reply_markup: keyboard});

    const fieldCtx = await conversation.wait();
    const field = fieldCtx.callbackQuery?.data || fieldCtx.message?.text;

    if (field === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    if (fieldCtx.callbackQuery) {
        await fieldCtx.answerCallbackQuery();
    }

    try {
        switch (field) {
            case USER_UPDATE_FIELDS.FIRST_NAME:
                await ctx.reply("Enter new First Name:");
                const fnCtx = await conversation.wait();
                if (fnCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newFirstName = fnCtx.message?.text || "";
                await prisma.user.update({
                    where: {id: userId},
                    data: {firstName: newFirstName}
                });
                await ctx.reply("✅ First Name updated successfully!");
                break;

            case USER_UPDATE_FIELDS.LAST_NAME:
                await ctx.reply("Enter new Last Name:");
                const lnCtx = await conversation.wait();
                if (lnCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newLastName = lnCtx.message?.text || "";
                await prisma.user.update({
                    where: {id: userId},
                    data: {lastName: newLastName}
                });
                await ctx.reply("✅ Last Name updated successfully!");
                break;

            case USER_UPDATE_FIELDS.USERNAME:
                await ctx.reply("Enter new Username (without @):");
                const unCtx = await conversation.wait();
                if (unCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newUsername = unCtx.message?.text || "";
                await prisma.user.update({
                    where: {id: userId},
                    data: {username: newUsername}
                });
                await ctx.reply("✅ Username updated successfully!");
                break;

            case USER_UPDATE_FIELDS.NOTIFICATIONS:
                const updated = await prisma.user.update({
                    where: {id: userId},
                    data: {allowNotifications: !user.allowNotifications}
                });
                await ctx.reply(`✅ Notifications ${updated.allowNotifications ? 'enabled' : 'disabled'}!`);
                break;

            default:
                await ctx.reply("❌ Invalid choice. Please use /admin_user to try again.");
        }
    } catch (error) {
        console.error("Error updating user:", error);
        await ctx.reply("❌ Failed to update user.");
    }
}

export async function adminUserDeleteConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🗑 <b>Delete User</b>\n\n⚠️ WARNING: This will delete the user and cascade to NotificationSchedule.\nSubscriptions and Feedbacks will remain orphaned.\n\nEnter User ID to delete:\n\nType /cancel to abort.", {parse_mode: "HTML"});
    
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

    const user = await prisma.user.findUnique({
        where: {id: userId},
        include: {
            subscriptions: true,
            feedbacks: true
        }
    });

    if (!user) {
        await ctx.reply(`❌ User with ID ${userId} not found.`);
        return;
    }

    let confirmMessage = `⚠️ <b>Confirm Deletion</b>\n\n`;
    confirmMessage += `User: ${user.firstName || ''} ${user.lastName || 'N/A'} (@${user.username || 'N/A'})\n`;
    confirmMessage += `Telegram ID: <code>${user.telegramId}</code>\n`;
    confirmMessage += `Subscriptions: ${user.subscriptions.length}\n`;
    confirmMessage += `Feedbacks: ${user.feedbacks.length}\n\n`;
    confirmMessage += `Type <b>DELETE</b> to confirm or /cancel to abort:`;

    await ctx.reply(confirmMessage, {parse_mode: "HTML"});

    const confirmCtx = await conversation.wait();
    if (confirmCtx.message?.text !== "DELETE") {
        await ctx.reply("❌ Deletion cancelled. Confirmation text did not match.");
        return;
    }

    try {
        await prisma.user.delete({where: {id: userId}});
        await ctx.reply(`✅ User ${userId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting user:", error);
        await ctx.reply("❌ Failed to delete user. Check console for details.");
    }
}
