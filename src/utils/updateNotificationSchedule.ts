import prisma from "../db.js";
import {TotalLessonsByType} from "../constants.js";
import {calculateNextPaymentDate, calculateUsedLessons} from "./index.js";

export const updateNotificationSchedule = async (userId: number) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscriptions: {
                where: { isActive: true },
                include: {
                    group: {
                        include: {
                            classDays: true
                        }
                    }
                },
                orderBy: {
                    startDate: 'desc'
                },
                take: 1
            }
        }
    });

    if (!user || !user.subscriptions.length) return;

    const [subscription] = user.subscriptions;
    if (!subscription) return;
    
    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: subscription.startDate
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    const totalLessons = TotalLessonsByType[subscription.typeOfSubscription] || 0;
    const usedLessons = calculateUsedLessons(
        subscription.startDate,
        subscription.group.classDays,
        holidays
    );
    const remainingLessons = Math.max(0, totalLessons - usedLessons + subscription.illnessCount);

    const nextPaymentDate = calculateNextPaymentDate(
        subscription.group.classDays,
        remainingLessons,
        holidays
    );

    await prisma.notificationSchedule.upsert({
        where: { userId },
        update: {
            lastSent: new Date(),
            nextDue: nextPaymentDate,
            updatedAt: new Date()
        },
        create: {
            userId,
            isEnabled: true,
            lastSent: new Date(),
            nextDue: nextPaymentDate
        }
    });
}