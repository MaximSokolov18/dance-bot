import {Composer} from "grammy/web";
import prisma from "../db.js";
import {GroupNameFormatMap, SubscriptionTypeFormatMap, TotalLessonsByType} from "../constants.js";
import {calculateNextPaymentDate, calculateUsedLessons, formatDate} from "../utils.js";

export const mysub = new Composer();

// TODO: add time in group lessons, handle holidays
// TODO: check/add abon for 4 lessons on specifyc weekday (e.g., 4 Monday lessons)
// TODO: add in mysub inf about hodays and notifaction status
mysub.command("mysub", async (ctx) => {
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: ctx.from.id},
        include: {
            subscriptions: {
                include: {
                    group: true
                },
                orderBy: {
                    startDate: 'desc'
                },
                take: 1
            }
        }
    });

    if (!user) {
        await ctx.reply("You don't have an account yet. Use /start to register.");
        return;
    }

    const [subscription] = user.subscriptions;

    if (!subscription) {
        await ctx.reply("You don't have any subscriptions yet.");
        return;
    }

    const holidays = await prisma.holiday.findMany({
        orderBy: {
            date: 'asc'
        }
    });

    const totalLessons = TotalLessonsByType[subscription.typeOfSubscription] || 0;
    const usedLessons = calculateUsedLessons(
        subscription.startDate,
        subscription.group.classDays,
        holidays,
    );
    const remainingLessons = Math.max(0, totalLessons - usedLessons + subscription.illnessCount);

    const nextPaymentDate = calculateNextPaymentDate(
        subscription.group.classDays,
        remainingLessons,
    );

    const subscriptionStart = new Date(subscription.startDate);
    const subscriptionEnd = new Date(nextPaymentDate);
    
    const affectedHolidays = holidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate <= subscriptionEnd && holidayDate >= subscriptionStart;
    });

    const message = [
        "🎭 Your Current Subscription:",
        `Type: ${SubscriptionTypeFormatMap[subscription.typeOfSubscription] || subscription.typeOfSubscription}`,
        `Group: ${GroupNameFormatMap[subscription.group.name] || subscription.group.name}`,
        `Lessons: ${remainingLessons} of ${totalLessons} remaining`,
        (subscription.illnessCount ? `\nGet well soon 🤒\nMissed due to illness: ${subscription.illnessCount}\n` : ""),
        `Next payment/renewal: ${formatDate(nextPaymentDate)}`,
        `\nClass days: ${subscription.group.classDays.join(", ")}`,
        (affectedHolidays.length > 0 ? `\n📅 Holidays:\n${affectedHolidays.map(h => `• ${h.name}: ${formatDate(new Date(h.date))}`).join('\n')}` : "")
    ].join("\n");

    await ctx.reply(message);
});