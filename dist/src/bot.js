import { Bot } from "grammy";
import cron from "node-cron";
import prisma from "./db.js";
import { getTotalLessons, formatSubscriptionType, formatDate, calculateUsedLessons, formatGroupName, calculateNextPaymentDate } from "./utils.js";
const bot = new Bot("8474953308:AAG4-jCmLQrPRThNPUo9thf4ObVporHFlpY");
await bot.api.setMyCommands([
    { command: "notify", description: "Toggle subscription notifications" },
    { command: "mysub", description: "View my subscription details" },
]);
bot.command("start", async (ctx) => {
    if (!ctx.from)
        return;
    const { id, first_name, last_name, username, language_code } = ctx.from;
    let user = await prisma.user.findUnique({ where: { telegramId: id } });
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
    if (!ctx.from)
        return;
    let user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });
    if (user) {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                allowNotifications: !user.allowNotifications
            }
        });
        if (updatedUser.allowNotifications) {
            cron.schedule('30 22 * * *', async () => {
                if (!ctx.from)
                    return;
                const user = await prisma.user.findUnique({
                    where: { telegramId: ctx.from.id },
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
                const totalLessons = getTotalLessons(subscription.typeOfSubscription);
                const usedLessons = calculateUsedLessons(subscription.startDate, subscription.group.classDays);
                const remainingLessons = Math.max(0, totalLessons - usedLessons + subscription.illnessCount);
                const nextPaymentDate = calculateNextPaymentDate(subscription.group.classDays, remainingLessons);
                const paymentDate = new Date(nextPaymentDate).getDate();
                const today = new Date().getDate();
                if (paymentDate === today) {
                    await bot.api.sendMessage(ctx.from.id, `🔔Your subscription is due for renewal today (${formatDate(nextPaymentDate)}).`);
                }
            });
        }
        else {
            cron.getTasks().forEach((task) => task.destroy());
        }
        await ctx.reply(updatedUser.allowNotifications
            ? "✅ Notifications enabled. You will receive updates about your subscription."
            : "🔕 Notifications disabled. You won't receive any updates.");
        return;
    }
    else {
        await ctx.reply("There is no user with this ID");
    }
});
bot.command("mysub", async (ctx) => {
    if (!ctx.from)
        return;
    const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from.id },
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
    const totalLessons = getTotalLessons(subscription.typeOfSubscription);
    const usedLessons = calculateUsedLessons(subscription.startDate, subscription.group.classDays);
    const remainingLessons = Math.max(0, totalLessons - usedLessons + subscription.illnessCount);
    const nextPaymentDate = calculateNextPaymentDate(subscription.group.classDays, remainingLessons);
    const message = [
        "🎭 Your Current Subscription:",
        `Type: ${formatSubscriptionType(subscription.typeOfSubscription)}`,
        `Group: ${formatGroupName(subscription.group.name)}`,
        `Classes: ${remainingLessons} of ${totalLessons} remaining`,
        (subscription.illnessCount ? `\nGet well soon 🤒\nMissed due to illness: ${subscription.illnessCount}\n` : ""),
        `Next payment/renewal: ${formatDate(nextPaymentDate)}`,
        `\nClass days: ${subscription.group.classDays.join(", ")}`
    ].join("\n");
    await ctx.reply(message);
});
bot.start();
//# sourceMappingURL=bot.js.map