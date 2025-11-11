import {Bot} from "grammy";
import cron from "node-cron";
import prisma from "./db.js";
import {
    formatDate,
    calculateUsedLessons,
    calculateNextPaymentDate
} from "./utils.js";
import {COMMANDS, TotalLessonsByType, GroupNameFormatMap, SubscriptionTypeFormatMap} from "./constants.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set. Please add it to your .env file.");
}

const bot = new Bot(BOT_TOKEN);
await bot.api.setMyCommands(COMMANDS);

bot.command("start", async (ctx) => {
    if (!ctx.from) return;

    const {
        id,
        first_name,
        last_name,
        username,
        language_code
    } = ctx.from;

    let user = await prisma.user.findUnique({where: {telegramId: id}});

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramId: id,
                firstName: first_name || null,
                lastName: last_name || null,
                username: username || null,
                languageCode: language_code || null,
                allowNotifications: true,
            }
        });
    }

    ctx.reply(`Welcome ${first_name || "there"}!`);
});

bot.command("notify", async (ctx) => {
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

                if (paymentDate === today) {
                    await bot.api.sendMessage(ctx.from.id, `🔔Your subscription is due for renewal today (${formatDate(nextPaymentDate)}).`);
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

bot.command("mysub", async (ctx) => {
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

bot.start();