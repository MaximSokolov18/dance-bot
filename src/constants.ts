import type { SubscriptionType, Weekday, DanceType } from "@prisma/client";

export const COMMANDS = [
    {command: "notify", description: "Toggle subscription notifications"},
    {command: "mysub", description: "View my subscription details"},
];

export const WeekDayToNumber: Record<Weekday, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6
};

export const TotalLessonsByType: Record<SubscriptionType, number> = {
    EightLessons: 8,
    FourLessons: 4,
    OneLesson: 1,
    Trial: 1,
};

export const GroupNameFormatMap: Record<DanceType, string> = {
    JazzFunk: "Jazz Funk",
    HighHeels: "High Heels",
};

export const SubscriptionTypeFormatMap: Record<SubscriptionType, string> = {
    EightLessons: "8 Lessons Package",
    FourLessons: "4 Lessons Package",
    OneLesson: "Single Lesson",
    Trial: "Trial Lesson",
};

