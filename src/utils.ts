import type {Weekday, Holiday, ClassDay} from "@prisma/client";
import {WeekDayToNumber} from "./constants.js";

export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export const isDateInHoliday = (date: Date, holidays: Holiday[]): boolean => {
    return holidays.some(holiday => {
        const holidayDate = holiday.date;
        return date.getFullYear() === holidayDate.getFullYear() &&
               date.getMonth() === holidayDate.getMonth() &&
               date.getDate() === holidayDate.getDate();
    });
}

export const setClassDateTime = (date: Date, timeString: string): Date | null => {
    const timeParts = timeString.split(':');
    
    if (timeParts.length !== 2) {
        return null;
    }
    
    const hours = parseInt(timeParts[0]!, 10);
    const minutes = parseInt(timeParts[1]!, 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }
    
    const classDateTime = new Date(date);
    classDateTime.setHours(hours, minutes, 0, 0);
    return classDateTime;
}

const findNearestClassDate = (startDate: Date, classDays: ClassDay[], holidays: Holiday[] = []): Date => {
    const date = new Date(startDate);
    const today = new Date();
    const maxDaysToSearch = 365;
    let daysSearched = 0;

    while (daysSearched < maxDaysToSearch) {
        if (!isDateInHoliday(date, holidays)) {
            const classDay = classDays.find(cd => WeekDayToNumber[cd.weekday] === date.getDay());
            const classDateTime = classDay ? setClassDateTime(date, classDay.time) : null;
            
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

export const calculateNextPaymentDate =(
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
            const classDateTime = setClassDateTime(currentDay, classDay.time);
            
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
