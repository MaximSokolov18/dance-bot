import {Composer} from "grammy/web";
import prisma from "../db.js";
import {GroupNameFormatMap, SubscriptionTypeFormatMap, TotalLessonsByType} from "../constants.js";
import {calculateNextPaymentDate, calculateUsedLessons, formatDate} from "../utils.js";

export const mysub = new Composer();

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

    const totalLessons = TotalLessonsByType[subscription.typeOfSubscription] || 0;
    const usedLessons = calculateUsedLessons(
        subscription.startDate,
        subscription.group.classDays,
    );
    const remainingLessons = Math.max(0, totalLessons - usedLessons + subscription.illnessCount);

    const nextPaymentDate = calculateNextPaymentDate(
        subscription.group.classDays,
        remainingLessons,
    );

    const message = [
        "🎭 Your Current Subscription:",
        `Type: ${SubscriptionTypeFormatMap[subscription.typeOfSubscription] || subscription.typeOfSubscription}`,
        `Group: ${GroupNameFormatMap[subscription.group.name] || subscription.group.name}`,
        `Lessons: ${remainingLessons} of ${totalLessons} remaining`,
        (subscription.illnessCount ? `\nGet well soon 🤒\nMissed due to illness: ${subscription.illnessCount}\n` : ""),
        `Next payment/renewal: ${formatDate(nextPaymentDate)}`,
        `\nClass days: ${subscription.group.classDays.join(", ")}`
    ].join("\n");

    await ctx.reply(message);
});