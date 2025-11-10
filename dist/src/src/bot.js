import { Bot } from "grammy";
import prisma from "./db.js";
const bot = new Bot("8474953308:AAG4-jCmLQrPRThNPUo9thf4ObVporHFlpY");
bot.command("start", (ctx) => ctx.reply("Welcome! Use /subscribe wto sstart your subscription."));
bot.command("subscribe", async (ctx) => {
    const tgId = ctx.from?.id;
    if (!tgId)
        return;
    let user = await prisma.user.findUnique({ where: { telegramId: tgId } });
    let users = await prisma.user.findFirst({ where: { telegramId: tgId } });
    console.log(users);
    if (!user) {
        user = await prisma.user.create({ data: { telegramId: tgId } });
    }
    await prisma.subscription.create({ data: { userId: user.id } });
    await ctx.reply("Subscription activated!");
});
bot.start();
//# sourceMappingURL=bot.js.map