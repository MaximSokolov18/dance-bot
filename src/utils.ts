import type {Weekday} from "@prisma/client";
import {WeekDayToNumber} from "./constants.js";

export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export const calculateNextPaymentDate =(
    classDays: Weekday[],
    remainingLessons: number,
): Date => {
    const classWeekDays = classDays.map((day) => WeekDayToNumber[day]);
    
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    const noLessons = remainingLessons <= 0;
    if (noLessons) {
        while (!classWeekDays.includes(nextDay.getDay())) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay;
    }
    
    let lessonsToFind = remainingLessons;
    
    while (lessonsToFind > 0) {
        if (classWeekDays.includes(nextDay.getDay())) {
            lessonsToFind--;
        }
        nextDay.setDate(nextDay.getDate() + 1);
    }
    
    while (!classWeekDays.includes(nextDay.getDay())) {
        nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
}

export const calculateUsedLessons = (startDate: Date, classDays: Weekday[]): number => {
    const today = new Date();
    const start = new Date(startDate);
    const classWeekDays = classDays.map((day) => WeekDayToNumber[day]);

    let lessonsOccurred = 0;
    const currentDay = new Date(start);
    
    while (currentDay <= today) {
        if (classWeekDays.includes(currentDay.getDay())) {
            lessonsOccurred++;
        }

        currentDay.setDate(currentDay.getDate() + 1);
    }

    return lessonsOccurred;
}
