import {Composer} from "grammy/web";
import prisma from "../db.js";
import {updateNotificationSchedule, initializeGlobalScheduler} from '../utils/index.js';

export const notify = new Composer();

initializeGlobalScheduler();

notify.command("notify", async (ctx) => {
    if (!ctx.from) return;

    let user = await prisma.user.findUnique({where: {telegramId: BigInt(ctx.from.id)}});

    if (user) {
        const updatedUser = await prisma.user.update({
            where: {id: user.id},
            data: {
                allowNotifications: !user.allowNotifications
            }
        });

        if (updatedUser.allowNotifications) {
            await updateNotificationSchedule(user.id);
            await prisma.notificationSchedule.upsert({
                where: { userId: user.id },
                update: { isEnabled: true },
                create: {
                    userId: user.id,
                    isEnabled: true
                }
            });
        } else {
            await prisma.notificationSchedule.updateMany({
                where: { userId: user.id },
                data: { isEnabled: false }
            });
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