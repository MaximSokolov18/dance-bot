import cron from "node-cron";
import {Api} from "grammy/web";
import {autoRetry} from "@grammyjs/auto-retry";
import {I18n} from "@grammyjs/i18n";
import prisma from "../db";
import {updateNotificationSchedule} from "./updateNotificationSchedule";
import {formatDate} from "./formatDate";

let globalSchedulerInitialized = false;

const notificationI18n = new I18n({
    defaultLocale: "en",
    directory: "locales",
    fluentBundleOptions: {
        useIsolating: false
    }
});

export const initializeGlobalScheduler = () => {
    if (globalSchedulerInitialized) return;
    
    globalSchedulerInitialized = true;
    cron.schedule('0 11 * * *', async () => {
        console.log('Running daily notification check...');
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const schedules = await prisma.notificationSchedule.findMany({
                where: {
                    isEnabled: true,
                    nextDue: {
                        gte: today,
                        lt: tomorrow
                    }
                },
                include: {
                    user: {
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
                                }
                            }
                        }
                    }
                }
            });

            const BOT_TOKEN = process.env.BOT_TOKEN;
            if (!BOT_TOKEN) return;
            
            const api = new Api(BOT_TOKEN);
            api.config.use(autoRetry({
                maxRetryAttempts: 3,
                maxDelaySeconds: 10,
            }));
            
            for (const schedule of schedules) {
                const user = schedule.user;
                const [subscription] = user.subscriptions;
                
                if (subscription && schedule.nextDue) {
                    const userLanguage = user.languageCode || "en";
                    const message = notificationI18n.t(userLanguage, "notification-renewal", { 
                        date: formatDate(schedule.nextDue) 
                    });
                    
                    try {
                        await api.sendMessage(user.telegramId.toString(), message);
                        
                        await updateNotificationSchedule(user.id);
                        
                        console.log(`Notification sent to user ${user.telegramId}`);
                    } catch (error) {
                        console.error(`Failed to send notification to user ${user.telegramId}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in global notification scheduler:', error);
        }
    });
}