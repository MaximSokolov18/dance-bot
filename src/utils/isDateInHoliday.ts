import type {Holiday} from "@prisma/client";

export const isDateInHoliday = (date: Date, holidays: Holiday[]): boolean => {
    return holidays.some(holiday => {
        const holidayDate = holiday.date;
        return date.getFullYear() === holidayDate.getFullYear() &&
               date.getMonth() === holidayDate.getMonth() &&
               date.getDate() === holidayDate.getDate();
    });
}