import {Composer} from "grammy/web";
import prisma from "../db.js";
import {GroupNameFormatMap, SubscriptionTypeFormatMap, TotalLessonsByType} from "../constants.js";
import {calculateNextPaymentDate, calculateUsedLessons, formatDate} from "../utils.js";

export const feedback = new Composer();

feedback.command("feedback", async (ctx) => {
    
});