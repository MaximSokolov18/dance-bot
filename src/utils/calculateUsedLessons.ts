import type {Holiday, ClassDay} from "@prisma/client";
import {WeekDayToNumber} from "../constants";
import {isDateInHoliday} from "./isDateInHoliday";
import {getClassDateTime} from "./getClassDateTime";

export const calculateUsedLessons = (startDate: Date, classDays: ClassDay[], holidays: Holiday[] = []): number => {
    const now = new Date();
    const start = new Date(startDate);

    let lessonsOccurred = 0;
    const currentDay = new Date(start);
    
    while (currentDay <= now) {
        if (isDateInHoliday(currentDay, holidays)) {
            currentDay.setDate(currentDay.getDate() + 1);
            continue;
        }

        const classDay = classDays.find(cd => WeekDayToNumber[cd.weekday] === currentDay.getDay());
        
        if (classDay) {
            const classDateTime = getClassDateTime(currentDay, classDay.time);
            
            if (!classDateTime) {
                currentDay.setDate(currentDay.getDate() + 1);
                continue;
            }
            
            if (currentDay.toDateString() === now.toDateString()) {
                if (now >= classDateTime) {
                    lessonsOccurred++;
                }
            } else if (currentDay < now) {
                lessonsOccurred++;
            }
        }

        currentDay.setDate(currentDay.getDate() + 1);
    }

    return lessonsOccurred;
}