import {Composer, InlineKeyboard} from "grammy/web";
import type {MyContext} from "../bot";
import {adminMiddleware} from "./middleware";
import prisma from "../db";
import type {Conversation} from "@grammyjs/conversations";
import type {Holiday, ClassDay, PaymentType, SubscriptionType, DanceType, Prisma} from "@prisma/client";
import {TotalLessonsByType, SubscriptionTypeFormatMap, GroupNameFormatMap, WeekDayToNumber} from "../constants";
import {ADMIN_EARNINGS_CALLBACKS, CONVERSATION_NAMES} from "./constants";
import {isDateInHoliday} from "../utils/isDateInHoliday";
import {getClassDateTime} from "../utils/getClassDateTime";

type SubscriptionWithGroup = Prisma.SubscriptionGetPayload<{
    include: {
        group: {
            include: {
                classDays: true;
            };
        };
    };
}>;

export const adminEarnings = new Composer<MyContext>();
adminEarnings.use(adminMiddleware);

adminEarnings.command("admin_earnings", async (ctx) => {
    const now = new Date();
    const currentMonthName = now.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthName = prevMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});

    const keyboard = new InlineKeyboard()
        .text(`📅 ${currentMonthName}`, ADMIN_EARNINGS_CALLBACKS.CURRENT_MONTH)
        .row()
        .text(`📆 ${prevMonthName}`, ADMIN_EARNINGS_CALLBACKS.PREV_MONTH)
        .row()
        .text("🔍 Custom Range", ADMIN_EARNINGS_CALLBACKS.CUSTOM);

    await ctx.reply("💰 <b>Monthly Earnings Report</b>\n\nSelect time period:", {
        parse_mode: "HTML",
        reply_markup: keyboard
    });
});

adminEarnings.callbackQuery(ADMIN_EARNINGS_CALLBACKS.CURRENT_MONTH, async (ctx) => {
    await ctx.answerCallbackQuery();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    await generateEarningsReport(ctx, startDate, endDate);
});

adminEarnings.callbackQuery(ADMIN_EARNINGS_CALLBACKS.PREV_MONTH, async (ctx) => {
    await ctx.answerCallbackQuery();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    await generateEarningsReport(ctx, startDate, endDate);
});

adminEarnings.callbackQuery(ADMIN_EARNINGS_CALLBACKS.CUSTOM, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(CONVERSATION_NAMES.ADMIN_EARNINGS_CUSTOM);
});

export async function adminEarningsCustomConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
    await ctx.reply("🔍 <b>Custom Date Range</b>\n\nEnter start date (YYYY-MM-DD):\n\nType /cancel to abort.", {parse_mode: "HTML"});

    const startCtx = await conversation.wait();
    if (startCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const startDate = new Date(startCtx.message?.text || "");
    if (isNaN(startDate.getTime())) {
        await ctx.reply("❌ Invalid date format. Please use YYYY-MM-DD.");
        return;
    }

    await ctx.reply("Enter end date (YYYY-MM-DD):");

    const endCtx = await conversation.wait();
    if (endCtx.message?.text === "/cancel") {
        await ctx.reply("❌ Operation cancelled.");
        return;
    }

    const endDate = new Date(endCtx.message?.text || "");
    if (isNaN(endDate.getTime())) {
        await ctx.reply("❌ Invalid date format. Please use YYYY-MM-DD.");
        return;
    }

    // Validation
    if (endDate <= startDate) {
        await ctx.reply("❌ End date must be after start date.");
        return;
    }

    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
        await ctx.reply("❌ Date range too large. Maximum 12 months (365 days) allowed.");
        return;
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    await generateEarningsReport(ctx, startDate, endDate);
}

/**
 * Count lessons that occurred within a specific month for a subscription
 */
function countLessonsInMonth(
    subscriptionStartDate: Date,
    classDays: ClassDay[],
    holidays: Holiday[],
    monthStart: Date,
    monthEnd: Date
): number {
    const now = new Date();

    // Determine the actual start date for counting (max of subscription start and month start)
    const countStart = new Date(Math.max(subscriptionStartDate.getTime(), monthStart.getTime()));

    // Determine the actual end date for counting (min of now and month end)
    const countEnd = new Date(Math.min(now.getTime(), monthEnd.getTime()));

    // If count range is invalid, return 0
    if (countStart > countEnd) {
        return 0;
    }

    let lessonsOccurred = 0;
    const currentDay = new Date(countStart);

    while (currentDay <= countEnd) {
        // Skip holidays
        if (isDateInHoliday(currentDay, holidays)) {
            currentDay.setDate(currentDay.getDate() + 1);
            continue;
        }

        // Check if it's a class day
        const classDay = classDays.find(cd => WeekDayToNumber[cd.weekday] === currentDay.getDay());

        if (classDay) {
            const classDateTime = getClassDateTime(currentDay, classDay.time);

            if (!classDateTime) {
                currentDay.setDate(currentDay.getDate() + 1);
                continue;
            }

            // Only count if the class has occurred (class time has passed)
            if (currentDay.toDateString() === now.toDateString()) {
                if (now >= classDateTime) {
                    lessonsOccurred++;
                }
            } else if (currentDay < now) {
                lessonsOccurred++;
            }
        }

        currentDay.setDate(currentDay.getDate() + 1);
    }

    return lessonsOccurred;
}

type PaymentMethodInfo = Record<PaymentType, {amount: number; count: number;}>;
type SubscriptionTypeInfo = Record<SubscriptionType, {amount: number; count: number;}>;
type DanceGroupInfo = Record<DanceType, {amount: number; count: number;}>;
type EarningsData = {
    totalEarnings: number;
    subscriptionCount: number;
    byPaymentMethod: PaymentMethodInfo;
    bySubscriptionType: SubscriptionTypeInfo;
    byDanceGroup: DanceGroupInfo;
}

async function generateEarningsReport(ctx: MyContext, startDate: Date, endDate: Date) {
    try {
        await ctx.reply("⏳ Calculating earnings... This may take a moment.");

        const subscriptions = await prisma.subscription.findMany({
            where: {
                startDate: {
                    lte: endDate
                },
            },
            include: {
                group: {
                    include: {
                        classDays: true
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        }) as SubscriptionWithGroup[];

        const holidays = await prisma.holiday.findMany();

        const earningsData: EarningsData = {
            totalEarnings: 0,
            subscriptionCount: 0,
            byPaymentMethod: {} as PaymentMethodInfo,
            bySubscriptionType: {} as SubscriptionTypeInfo,
            byDanceGroup: {} as DanceGroupInfo
        };

        for (const sub of subscriptions) {
            const totalLessons = TotalLessonsByType[sub.typeOfSubscription];
            const costPerLesson = Number(sub.amountOfPayment) / totalLessons;

            const lessonsInMonth = countLessonsInMonth(
                sub.startDate,
                sub.group.classDays,
                holidays,
                startDate,
                endDate
            );

            if (lessonsInMonth === 0) {
                continue;
            }

            const earningsFromSub = costPerLesson * lessonsInMonth;

            earningsData.totalEarnings += earningsFromSub;
            earningsData.subscriptionCount++;

            if (!earningsData.byPaymentMethod[sub.typeOfPayment]) {
                earningsData.byPaymentMethod[sub.typeOfPayment] = {amount: 0, count: 0};
            }
            earningsData.byPaymentMethod[sub.typeOfPayment].amount += earningsFromSub;
            earningsData.byPaymentMethod[sub.typeOfPayment].count++;

            if (!earningsData.bySubscriptionType[sub.typeOfSubscription]) {
                earningsData.bySubscriptionType[sub.typeOfSubscription] = {amount: 0, count: 0};
            }
            earningsData.bySubscriptionType[sub.typeOfSubscription].amount += earningsFromSub;
            earningsData.bySubscriptionType[sub.typeOfSubscription].count++;

            if (!earningsData.byDanceGroup[sub.group.name]) {
                earningsData.byDanceGroup[sub.group.name] = {amount: 0, count: 0};
            }
            earningsData.byDanceGroup[sub.group.name].amount += earningsFromSub;
            earningsData.byDanceGroup[sub.group.name].count++;
        }

        const periodLabel = startDate.toLocaleDateString('en-US', {month: 'long', year: 'numeric'}) ===
            endDate.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})
            ? startDate.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})
            : `${startDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} - ${endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;

        let message = `💰 <b>Monthly Earnings Report</b>\n`;
        message += `📅 ${periodLabel}\n\n`;

        if (earningsData.subscriptionCount === 0) {
            message += `📊 No earnings recorded for this period.`;
            await ctx.reply(message, {parse_mode: "HTML"});
            return;
        }

        message += `━━━━━━━━━━━━━━━━━━━\n`;
        message += `📊 <b>SUMMARY</b>\n`;
        message += `Total Earnings: <b>€${earningsData.totalEarnings.toFixed(2)}</b>\n`;
        message += `Subscriptions: ${earningsData.subscriptionCount}\n`;

        // By payment method
        if (Object.keys(earningsData.byPaymentMethod).length > 0) {
            message += `\n━━━━━━━━━━━━━━━━━━━\n`;
            message += `💳 <b>BY PAYMENT METHOD</b>\n`;
            for (const [method, data] of Object.entries(earningsData.byPaymentMethod)) {
                message += `  ${method}: €${data.amount.toFixed(2)} (${data.count})\n`;
            }
        }

        // By subscription type
        if (Object.keys(earningsData.bySubscriptionType).length > 0) {
            message += `\n━━━━━━━━━━━━━━━━━━━\n`;
            message += `🎫 <b>BY PACKAGE TYPE</b>\n`;
            for (const [type, data] of Object.entries(earningsData.bySubscriptionType)) {
                const typeName = SubscriptionTypeFormatMap[type as SubscriptionType];
                message += `  ${typeName}: €${data.amount.toFixed(2)} (${data.count})\n`;
            }
        }

        // By dance group
        if (Object.keys(earningsData.byDanceGroup).length > 0) {
            message += `\n━━━━━━━━━━━━━━━━━━━\n`;
            message += `🎭 <b>BY DANCE GROUP</b>\n`;
            for (const [group, data] of Object.entries(earningsData.byDanceGroup)) {
                const groupName = GroupNameFormatMap[group as DanceType];
                message += `  ${groupName}: €${data.amount.toFixed(2)} (${data.count})\n`;
            }
        }

        await ctx.reply(message, {parse_mode: "HTML"});

    } catch (error) {
        console.error("Error generating earnings report:", error);
        await ctx.reply("❌ Failed to generate earnings report. Check console for details.");
    }
}
