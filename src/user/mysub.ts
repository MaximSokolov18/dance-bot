import {Composer} from "grammy/web";
import prisma from "../db";
import {TotalLessonsByType, WeekDayToNumber} from "../constants";
import {calculateNextPaymentDate, calculateUsedLessons, formatDate, translateDanceType, translateSubscriptionType, translateWeekday} from "../utils";
import type {MyContext} from "../bot";

export const mysub = new Composer<MyContext>();

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
        await ctx.reply(ctx.t("mysub-no-account"));
        return;
    }

    if (user.subscriptions.length === 0) {
        await ctx.reply(ctx.t("mysub-no-subscriptions"));
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
            ctx.t("mysub-title"),
            ctx.t("mysub-type", { type: translateSubscriptionType(typeOfSubscription, ctx) }),
            ctx.t("mysub-group", { group: translateDanceType(group.name, ctx) }),
            ctx.t("mysub-lessons", { 
                remaining: remainingLessons > totalLessons ? totalLessons : remainingLessons, 
                total: totalLessons 
            }),
            " ",
            (illnessCount ? ctx.t("mysub-illness", { count: illnessCount }) : ""),
            ctx.t("mysub-schedule") + "\n" + group.classDays.map(cd => 
                ctx.t("mysub-schedule-item", { 
                    weekday: translateWeekday(cd.weekday, ctx), 
                    time: cd.time 
                })
            ).join("\n"),
            (affectedHolidays.length > 0 ? 
                "\n" + ctx.t("mysub-holidays") + "\n" + affectedHolidays.map(h => 
                    ctx.t("mysub-holiday-item", { 
                        name: h.name, 
                        date: formatDate(new Date(h.date), user.languageCode || 'en') 
                    })
                ).join('\n') : 
                ""
            ),
            ctx.t("mysub-notifications", { 
                status: user.allowNotifications ? ctx.t("mysub-notifications-enabled") : ctx.t("mysub-notifications-disabled") 
            }),
            ctx.t("mysub-next-payment", {date: formatDate(nextPaymentDate, user.languageCode || 'en')}),
        ].filter(line => line !== "").join("\n");

        await ctx.reply(message, {parse_mode: "HTML"});
    });
});