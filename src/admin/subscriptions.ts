import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot.js";
import {adminMiddleware} from "./middleware.js";
import prisma from "../db.js";
import type {Conversation} from "@grammyjs/conversations";
import {SubscriptionType, PaymentType} from "@prisma/client";
import {SubscriptionTypeFormatMap} from "../constants.js";
import {ADMIN_SUBSCRIPTION_CALLBACKS, SUBSCRIPTION_FILTERS, SUBSCRIPTION_UPDATE_FIELDS, CONVERSATION_NAMES} from "./constants.js";

export const adminSubscriptions = new Composer<MyContext>();
adminSubscriptions.use(adminMiddleware);

adminSubscriptions.command("admin_subscription", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("📋 List Subscriptions", ADMIN_SUBSCRIPTION_CALLBACKS.LIST)
        .text("👁 View", ADMIN_SUBSCRIPTION_CALLBACKS.VIEW).row()
        .text("➕ Create", ADMIN_SUBSCRIPTION_CALLBACKS.CREATE)
        .text("✏️ Update", ADMIN_SUBSCRIPTION_CALLBACKS.UPDATE).row()
        .text("🗑 Delete", ADMIN_SUBSCRIPTION_CALLBACKS.DELETE);

    await ctx.reply("🎫 <b>Subscription Management</b>\n\nSelect an operation:", {
        parse_mode: "HTML",
        reply_markup: keyboard
    });
});

adminSubscriptions.callbackQuery(ADMIN_SUBSCRIPTION_CALLBACKS.LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_LIST);
});

adminSubscriptions.callbackQuery(ADMIN_SUBSCRIPTION_CALLBACKS.VIEW, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_VIEW);
});

adminSubscriptions.callbackQuery(ADMIN_SUBSCRIPTION_CALLBACKS.CREATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_CREATE);
});

adminSubscriptions.callbackQuery(ADMIN_SUBSCRIPTION_CALLBACKS.UPDATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_UPDATE);
});

adminSubscriptions.callbackQuery(ADMIN_SUBSCRIPTION_CALLBACKS.DELETE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_SUBSCRIPTION_DELETE);
});

async function listSubscriptions(ctx: MyContext, whereClause: any) {
    try {
        const subscriptions = await prisma.subscription.findMany({
            where: whereClause,
            take: 20,
            orderBy: {createdAt: 'desc'},
            include: {
                user: true,
                group: {include: {classDays: true}}
            }
        });

        if (subscriptions.length === 0) {
            await ctx.reply("📋 No subscriptions found.");
            return;
        }

        let message = "📊 <b>Subscriptions List</b> (showing first 20):\n\n";

        for (const sub of subscriptions) {
            message += `ID: <code>${sub.id}</code> ${sub.isActive ? '✅' : '❌'}\n`;
            message += `User: ${sub.user.firstName || ''} ${sub.user.lastName || ''} (ID: ${sub.userId})\n`;
            message += `Type: ${SubscriptionTypeFormatMap[sub.typeOfSubscription]}\n`;
            message += `Group: ${sub.group.name}\n`;
            message += `Payment: €${sub.amountOfPayment} (${sub.typeOfPayment})\n`;
            message += `Start: ${sub.startDate.toLocaleDateString()}\n`;
            message += `Illness Days: ${sub.illnessCount}\n`;
            message += `───────────────\n`;
        }

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error listing subscriptions:", error);
        await ctx.reply("❌ Failed to retrieve subscriptions.");
    }
}

export async function adminSubscriptionsListConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    const keyboard = new InlineKeyboard()
        .text("✅ Active only", SUBSCRIPTION_FILTERS.ACTIVE)
        .text("❌ Inactive only", SUBSCRIPTION_FILTERS.INACTIVE).row()
        .text("📋 All", SUBSCRIPTION_FILTERS.ALL);

    await ctx.reply("📋 Filter by status:", {reply_markup: keyboard});

    const choiceCtx = await conversation.wait();
    
    if (choiceCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const choice = choiceCtx.callbackQuery?.data || choiceCtx.message?.text;
    
    if (choiceCtx.callbackQuery) {
        await choiceCtx.answerCallbackQuery();
    }

    let whereClause = {};

    if (choice === SUBSCRIPTION_FILTERS.ACTIVE) {
        whereClause = {isActive: true};
    } else if (choice === SUBSCRIPTION_FILTERS.INACTIVE) {
        whereClause = {isActive: false};
    }

    await listSubscriptions(ctx, whereClause);
}

export async function adminSubscriptionViewConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("📊 Enter the Subscription ID to view details:\n\nType /cancel to abort.");

    const subIdCtx = await conversation.wait();
    if (subIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const subId = parseInt(subIdCtx.message?.text || "");
    if (isNaN(subId)) {
        await ctx.reply("❌ Invalid Subscription ID.");
        return;
    }

    try {
        const subscription = await prisma.subscription.findUnique({
            where: {id: subId},
            include: {
                user: true,
                group: {include: {classDays: true}}
            }
        });

        if (!subscription) {
            await ctx.reply(`❌ Subscription with ID ${subId} not found.`);
            return;
        }

        let message = `📊 <b>Subscription Details</b>\n\n`;
        message += `<b>ID:</b> <code>${subscription.id}</code>\n`;
        message += `<b>Status:</b> ${subscription.isActive ? '✅ Active' : '❌ Inactive'}\n\n`;
        
        message += `<b>User Information:</b>\n`;
        message += `  ID: ${subscription.userId}\n`;
        message += `  Name: ${subscription.user.firstName || ''} ${subscription.user.lastName || 'N/A'}\n`;
        message += `  Username: @${subscription.user.username || 'N/A'}\n`;
        message += `  Telegram ID: <code>${subscription.user.telegramId}</code>\n\n`;
        
        message += `<b>Subscription Details:</b>\n`;
        message += `  Type: ${SubscriptionTypeFormatMap[subscription.typeOfSubscription]}\n`;
        message += `  Group: ${subscription.group.name}\n`;
        message += `  Class Days: ${subscription.group.classDays.map(cd => `${cd.weekday} ${cd.time}`).join(', ')}\n\n`;
        
        message += `<b>Payment Information:</b>\n`;
        message += `  Amount: €${subscription.amountOfPayment}\n`;
        message += `  Method: ${subscription.typeOfPayment}\n`;
        message += `  Payment Date: ${subscription.paymentDate.toLocaleDateString()}\n\n`;
        
        message += `<b>Dates:</b>\n`;
        message += `  Start: ${subscription.startDate.toLocaleDateString()}\n`;
        message += `  End: ${subscription.endDate ? subscription.endDate.toLocaleDateString() : 'N/A'}\n\n`;
        
        message += `<b>Additional:</b>\n`;
        message += `  Illness Days: ${subscription.illnessCount}\n`;
        message += `  Created: ${subscription.createdAt.toLocaleString()}\n`;
        message += `  Updated: ${subscription.updatedAt.toLocaleString()}\n`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error viewing subscription:", error);
        await ctx.reply("❌ Failed to retrieve subscription details.");
    }
}

export async function adminSubscriptionCreateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("➕ <b>Create New Subscription</b>\n\nEnter User ID:\n\nType /cancel to abort.", {parse_mode: "HTML"});

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

    const groups = await prisma.group.findMany({include: {classDays: true}});
    let groupsMessage = "Select Group ID:\n\n";
    for (const group of groups) {
        groupsMessage += `${group.id} - ${group.name} (${group.classDays.map(cd => `${cd.weekday} ${cd.time}`).join(', ')})\n`;
    }
    groupsMessage += "\nEnter Group ID:";
    await ctx.reply(groupsMessage);

    const groupIdCtx = await conversation.wait();
    if (groupIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const groupId = parseInt(groupIdCtx.message?.text || "");
    if (isNaN(groupId) || !groups.find(g => g.id === groupId)) {
        await ctx.reply("❌ Invalid Group ID.");
        return;
    }

    const activeSubscriptionInGroup = await prisma.subscription.findFirst({
        where: {userId, groupId, isActive: true}
    });

    if (activeSubscriptionInGroup) {
        await ctx.reply(`⚠️ User already has an active subscription for this group (ID: ${activeSubscriptionInGroup.id}).\nDeactivate it first or set this subscription as inactive.`);
    }

    let typeMessage = "Select Subscription Type:\n\n";
    typeMessage += "1 - Eight Lessons\n";
    typeMessage += "2 - Four Lessons\n";
    typeMessage += "3 - One Lesson\n";
    typeMessage += "4 - Trial\n\n";
    typeMessage += "Enter choice (1-4):";
    await ctx.reply(typeMessage);

    const typeCtx = await conversation.wait();
    if (typeCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    let typeOfSubscription: SubscriptionType;
    switch (typeCtx.message?.text) {
        case "1":
            typeOfSubscription = SubscriptionType.EightLessons;
            break;
        case "2":
            typeOfSubscription = SubscriptionType.FourLessons;
            break;
        case "3":
            typeOfSubscription = SubscriptionType.OneLesson;
            break;
        case "4":
            typeOfSubscription = SubscriptionType.Trial;
            break;
        default:
            await ctx.reply("❌ Invalid choice.");
            return;
    }

    await ctx.reply("Enter payment amount (e.g., 45.00):");
    const amountCtx = await conversation.wait();
    if (amountCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const amountOfPayment = parseFloat(amountCtx.message?.text || "");
    if (isNaN(amountOfPayment) || amountOfPayment < 0) {
        await ctx.reply("❌ Invalid payment amount.");
        return;
    }

    let paymentTypeMessage = "Select Payment Type:\n\n";
    paymentTypeMessage += "1 - Santander\n";
    paymentTypeMessage += "2 - Cash\n";
    paymentTypeMessage += "3 - Mono\n";
    paymentTypeMessage += "4 - Other\n\n";
    paymentTypeMessage += "Enter choice (1-4):";
    await ctx.reply(paymentTypeMessage);

    const paymentTypeCtx = await conversation.wait();
    if (paymentTypeCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    let typeOfPayment: PaymentType;
    switch (paymentTypeCtx.message?.text) {
        case "1":
            typeOfPayment = PaymentType.Santander;
            break;
        case "2":
            typeOfPayment = PaymentType.Cash;
            break;
        case "3":
            typeOfPayment = PaymentType.Mono;
            break;
        case "4":
            typeOfPayment = PaymentType.Other;
            break;
        default:
            await ctx.reply("❌ Invalid choice.");
            return;
    }

    await ctx.reply("Enter start date (YYYY-MM-DD) or 'today':");
    const dateCtx = await conversation.wait();
    if (dateCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    let startDate: Date;
    if (dateCtx.message?.text === "today") {
        startDate = new Date();
    } else {
        startDate = new Date(dateCtx.message?.text || "");
        if (isNaN(startDate.getTime())) {
            await ctx.reply("❌ Invalid date format.");
            return;
        }
    }

    const isActiveMessage = activeSubscriptionInGroup 
        ? "⚠️ User has active subscription for this group. Set this as active? (yes/no):"
        : "Set as active? (yes/no):";
    await ctx.reply(isActiveMessage);

    const activeCtx = await conversation.wait();
    if (activeCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const isActive = activeCtx.message?.text?.toLowerCase() === "yes";

    if (isActive && activeSubscriptionInGroup) {
        await ctx.reply("⚠️ Deactivating previous active subscription for this group...");
        await prisma.subscription.update({
            where: {id: activeSubscriptionInGroup.id},
            data: {isActive: false}
        });
    }

    try {
        const subscription = await prisma.subscription.create({
            data: {
                userId,
                groupId,
                typeOfSubscription,
                amountOfPayment,
                typeOfPayment,
                startDate,
                paymentDate: startDate,
                isActive
            },
            include: {
                user: true,
                group: true
            }
        });

        let message = `✅ <b>Subscription Created Successfully!</b>\n\n`;
        message += `<b>ID:</b> ${subscription.id}\n`;
        message += `<b>User:</b> ${subscription.user.firstName || ''} ${subscription.user.lastName || ''}\n`;
        message += `<b>Type:</b> ${SubscriptionTypeFormatMap[subscription.typeOfSubscription]}\n`;
        message += `<b>Group:</b> ${subscription.group.name}\n`;
        message += `<b>Amount:</b> €${subscription.amountOfPayment}\n`;
        message += `<b>Status:</b> ${subscription.isActive ? '✅ Active' : '❌ Inactive'}\n`;

        await ctx.reply(message, {parse_mode: "HTML"});
    } catch (error) {
        console.error("Error creating subscription:", error);
        await ctx.reply("❌ Failed to create subscription. Check console for details.");
    }
}

export async function adminSubscriptionUpdateConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("✏️ <b>Update Subscription</b>\n\nEnter Subscription ID:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const subIdCtx = await conversation.wait();
    if (subIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const subId = parseInt(subIdCtx.message?.text || "");
    if (isNaN(subId)) {
        await ctx.reply("❌ Invalid Subscription ID.");
        return;
    }

    const subscription = await prisma.subscription.findUnique({
        where: {id: subId},
        include: {user: true, group: true}
    });

    if (!subscription) {
        await ctx.reply(`❌ Subscription with ID ${subId} not found.`);
        return;
    }

    let message = `Current subscription:\n`;
    message += `Type: ${SubscriptionTypeFormatMap[subscription.typeOfSubscription]}\n`;
    message += `Amount: €${subscription.amountOfPayment}\n`;
    message += `Illness Days: ${subscription.illnessCount}\n`;
    message += `Status: ${subscription.isActive ? 'Active' : 'Inactive'}\n\n`;

    const keyboard = new InlineKeyboard()
        .text("🏥 Add Illness Days", SUBSCRIPTION_UPDATE_FIELDS.ILLNESS)
        .text("💰 Update Amount", SUBSCRIPTION_UPDATE_FIELDS.AMOUNT).row()
        .text("📅 Set End Date", SUBSCRIPTION_UPDATE_FIELDS.END_DATE)
        .text("🔄 Toggle Status", SUBSCRIPTION_UPDATE_FIELDS.STATUS);

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
            case SUBSCRIPTION_UPDATE_FIELDS.ILLNESS:
                await ctx.reply(`Current illness days: ${subscription.illnessCount}\nEnter days to add:`);
                const daysCtx = await conversation.wait();
                if (daysCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const daysToAdd = parseInt(daysCtx.message?.text || "");
                if (isNaN(daysToAdd) || daysToAdd < 0) {
                    await ctx.reply("❌ Invalid number of days.");
                    return;
                }
                await prisma.subscription.update({
                    where: {id: subId},
                    data: {illnessCount: subscription.illnessCount + daysToAdd}
                });
                await ctx.reply(`✅ Illness days updated to ${subscription.illnessCount + daysToAdd}!`);
                break;

            case SUBSCRIPTION_UPDATE_FIELDS.AMOUNT:
                await ctx.reply(`Current amount: €${subscription.amountOfPayment}\nEnter new amount:`);
                const amountCtx = await conversation.wait();
                if (amountCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const newAmount = parseFloat(amountCtx.message?.text || "");
                if (isNaN(newAmount) || newAmount < 0) {
                    await ctx.reply("❌ Invalid amount.");
                    return;
                }
                await prisma.subscription.update({
                    where: {id: subId},
                    data: {amountOfPayment: newAmount}
                });
                await ctx.reply(`✅ Payment amount updated to €${newAmount}!`);
                break;

            case SUBSCRIPTION_UPDATE_FIELDS.END_DATE:
                await ctx.reply("Enter end date (YYYY-MM-DD):");
                const dateCtx = await conversation.wait();
                if (dateCtx.message?.text === "/cancel") {
                    await ctx.reply("❌ Operation cancelled.");
                    return;
                }
                const endDate = new Date(dateCtx.message?.text || "");
                if (isNaN(endDate.getTime())) {
                    await ctx.reply("❌ Invalid date format.");
                    return;
                }
                await prisma.subscription.update({
                    where: {id: subId},
                    data: {endDate}
                });
                await ctx.reply(`✅ End date set to ${endDate.toLocaleDateString()}!`);
                break;

            case SUBSCRIPTION_UPDATE_FIELDS.STATUS:
                if (!subscription.isActive) {
                    const existingActive = await prisma.subscription.findFirst({
                        where: {
                            userId: subscription.userId,
                            groupId: subscription.groupId,
                            isActive: true,
                            id: {not: subId}
                        }
                    });
                    if (existingActive) {
                        await ctx.reply(`⚠️ User has another active subscription for this group (ID: ${existingActive.id}).\nDeactivate it first.`);
                        return;
                    }
                }
                
                const updated = await prisma.subscription.update({
                    where: {id: subId},
                    data: {isActive: !subscription.isActive}
                });
                await ctx.reply(`✅ Subscription ${updated.isActive ? 'activated' : 'deactivated'}!`);
                break;

            default:
                await ctx.reply("❌ Invalid choice.");
        }
    } catch (error) {
        console.error("Error updating subscription:", error);
        await ctx.reply("❌ Failed to update subscription.");
    }
}

export async function adminSubscriptionDeleteConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🗑 <b>Delete Subscription</b>\n\n⚠️ WARNING: This will permanently delete the subscription record.\nConsider deactivating instead (use /admin_subscription_update).\n\nEnter Subscription ID to delete:\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const subIdCtx = await conversation.wait();
    if (subIdCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const subId = parseInt(subIdCtx.message?.text || "");
    if (isNaN(subId)) {
        await ctx.reply("❌ Invalid Subscription ID.");
        return;
    }

    const subscription = await prisma.subscription.findUnique({
        where: {id: subId},
        include: {user: true, group: true}
    });

    if (!subscription) {
        await ctx.reply(`❌ Subscription with ID ${subId} not found.`);
        return;
    }

    let confirmMessage = `⚠️ <b>Confirm Deletion</b>\n\n`;
    confirmMessage += `Subscription ID: ${subscription.id}\n`;
    confirmMessage += `User: ${subscription.user.firstName || ''} ${subscription.user.lastName || ''}\n`;
    confirmMessage += `Type: ${SubscriptionTypeFormatMap[subscription.typeOfSubscription]}\n`;
    confirmMessage += `Status: ${subscription.isActive ? '✅ Active' : '❌ Inactive'}\n\n`;
    confirmMessage += `Type <b>DELETE</b> to confirm or /cancel to abort:`;

    await ctx.reply(confirmMessage, {parse_mode: "HTML"});

    const confirmCtx = await conversation.wait();
    if (confirmCtx.message?.text !== "DELETE") {
        await ctx.reply("❌ Deletion cancelled. Confirmation text did not match.");
        return;
    }

    try {
        await prisma.subscription.delete({where: {id: subId}});
        await ctx.reply(`✅ Subscription ${subId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting subscription:", error);
        await ctx.reply("❌ Failed to delete subscription. Check console for details.");
    }
}
