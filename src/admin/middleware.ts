import {Composer} from "grammy/web";
import type {MyContext} from "../bot";

/**
 * Admin authentication middleware
 * Checks if the user is authorized to use admin commands
 */
export const adminMiddleware = new Composer<MyContext>();

adminMiddleware.use(async (ctx, next) => {
    if (!ctx.from) {
        await ctx.reply("❌ Unable to verify user identity.");
        return;
    }

    const adminId = process.env.ADMIN_TELEGRAM_ID;
    
    if (!adminId) {
        console.error("ADMIN_TELEGRAM_ID is not set in environment variables");
        await ctx.reply("❌ Admin access is not configured.");
        return;
    }

    if (ctx.from.id.toString() !== adminId) {
        await ctx.reply("❌ Access denied. Admin privileges required.");
        console.warn(`Unauthorized admin command attempt by user ${ctx.from.id}`);
        return;
    }

    await next();
});
