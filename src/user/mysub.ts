import {Composer} from "grammy/web";
import prisma from "../db";
import {GroupNameFormatMap, SubscriptionTypeFormatMap, TotalLessonsByType, WeekDayToNumber} from "../constants";
import {calculateNextPaymentDate, calculateUsedLessons, formatDate} from "../utils";

export const mysub = new Composer();

mysub.command("mysub", async (ctx) => {
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
        where: {telegramId: BigInt(ctx.from.id)},
        include: {
            subscriptions: {
                where: {
                    isActive: true
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
            }
        }
    });

    if (!user) {
        await ctx.reply("You don't have an account yet. Use /start to register.");
        return;
    }

    if (user.subscriptions.length === 0) {
        await ctx.reply("You don't have any active subscriptions yet. Contact your trainer for details.");
        return;
    }

    const {subscriptions} = user;
    const startDate = subscriptions.reduce((earliest, sub) => {
        const subDate = new Date(sub.startDate);
        return subDate < earliest ? subDate : earliest;
    }, new Date()); 

    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: startDate
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    subscriptions.forEach(async ({typeOfSubscription, startDate, group, illnessCount}) => {
        const totalLessons = TotalLessonsByType[typeOfSubscription] || 0;
        const usedLessons = calculateUsedLessons(
            startDate,
            group.classDays,
            holidays,
        );
        const remainingLessons = Math.max(0, totalLessons - usedLessons + illnessCount);

        const nextPaymentDate = calculateNextPaymentDate(
            group.classDays,
            remainingLessons,
            holidays
        );

        const subscriptionStart = new Date(startDate);
        const subscriptionEnd = new Date(nextPaymentDate);

        const classWeekDays = group.classDays.map((classDay) => WeekDayToNumber[classDay.weekday]);
        const affectedHolidays = holidays.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            const isInSubscriptionPeriod = holidayDate <= subscriptionEnd && holidayDate >= subscriptionStart;
            const isOnClassDay = classWeekDays.includes(holidayDate.getDay());
            return isInSubscriptionPeriod && isOnClassDay;
        });

        const message = [
            "🎭 Your Subscription:",
            `Type: ${SubscriptionTypeFormatMap[typeOfSubscription] || typeOfSubscription}`,
            `Group: ${GroupNameFormatMap[group.name] || group.name}`,
            `Lessons: ${remainingLessons > totalLessons ? totalLessons : remainingLessons} of ${totalLessons} remaining`,
            `Notifications(demo): ${user.allowNotifications ? "Enabled ✅" : "Disabled ❌"}`,
            (illnessCount ? `\nGet well soon 🤒\nMissed due to illness: ${illnessCount}\n` : ""),
            `Class schedule:\n${group.classDays.map(cd => `• ${cd.weekday} at ${cd.time}`).join("\n")}`,
            (affectedHolidays.length > 0 ? `\n📅 Holidays:\n${affectedHolidays.map(h => `• ${h.name}: ${formatDate(new Date(h.date))}`).join('\n')}\n` : ""),
            `<b>Next payment/renewal:</b>\n${formatDate(nextPaymentDate)}`,
        ].join("\n");

        await ctx.reply(message, {parse_mode: "HTML"});
    });
});