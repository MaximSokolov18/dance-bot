import type {Holiday, ClassDay} from "@prisma/client";
import {WeekDayToNumber} from "../constants";
import {isDateInHoliday} from "./isDateInHoliday";
import {getClassDateTime} from "./getClassDateTime";

const findNearestClassDate = (startDate: Date, classDays: ClassDay[], holidays: Holiday[] = []): Date => {
    const date = new Date(startDate);
    const today = new Date();
    const maxDaysToSearch = 365;
    let daysSearched = 0;

    while (daysSearched < maxDaysToSearch) {
        if (!isDateInHoliday(date, holidays)) {
            const classDay = classDays.find(cd => WeekDayToNumber[cd.weekday] === date.getDay());
            const classDateTime = classDay ? getClassDateTime(date, classDay.time) : null;
            
            if (classDay && classDateTime) {
                if ((date.toDateString() === today.toDateString() && today < classDateTime) || date > today) {
                    return new Date(date);
                }
            }
        }
        
        date.setDate(date.getDate() + 1);
        daysSearched++;
    }

    return new Date(startDate);
}

export const calculateNextPaymentDate = (
    classDays: ClassDay[],
    remainingLessons: number,
    holidays: Holiday[] = []
): Date => {
    const classWeekDays = classDays.map((classDay) => WeekDayToNumber[classDay.weekday]);
    
    const nextDay = new Date();
    const noLessons = remainingLessons <= 0;

    if (noLessons) {
        return findNearestClassDate(nextDay, classDays, holidays);
    }
    
    let lessonsToFind = remainingLessons;
    
    while (lessonsToFind > 0) {
        if (classWeekDays.includes(nextDay.getDay()) && !isDateInHoliday(nextDay, holidays)) {
            lessonsToFind--;
        }
        nextDay.setDate(nextDay.getDate() + 1);
    }

    return findNearestClassDate(nextDay, classDays, holidays);
}