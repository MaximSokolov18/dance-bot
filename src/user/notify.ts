import {Api, Composer} from "grammy/web";
import prisma from "../db.js";
import cron from "node-cron";
import {TotalLessonsByType} from "../constants.js";
import {calculateNextPaymentDate, calculateUsedLessons, formatDate} from "../utils.js";

export const notify = new Composer();

// TODO: check notifications scheduling logic
notify.command("notify", async (ctx) => {
    if (!ctx.from) return;

    let user = await prisma.user.findUnique({where: {telegramId: ctx.from.id}});

    if (user) {
        const updatedUser = await prisma.user.update({
            where: {id: user.id},
            data: {
                allowNotifications: !user.allowNotifications
            }
        });

        if (updatedUser.allowNotifications) {
            cron.schedule('0 9 * * *', async () => {
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
                    return;
                }

                const [subscription] = user.subscriptions;

                if (!subscription) {
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

                const paymentDate = new Date(nextPaymentDate).getDate();
                const today = new Date().getDate();

                const BOT_TOKEN = process.env.BOT_TOKEN;
                if (paymentDate === today && BOT_TOKEN) {
                    await new Api(BOT_TOKEN).sendMessage(ctx.from.id, `🔔Your subscription is due for renewal today (${formatDate(nextPaymentDate)}).`);
                }
            });
        } else {
            cron.getTasks().forEach((task) => task.destroy());
        }

        await ctx.reply(
            updatedUser.allowNotifications
                ? "✅ Notifications enabled. You will receive updates about your subscription."
                : "🔕 Notifications disabled. You won't receive any updates."
        );
        return;
    } else {
        await ctx.reply("There is no user with this ID");
    }
});