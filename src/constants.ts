import type {SubscriptionType, Weekday, DanceType} from "@prisma/client";

export const COMMANDS = [
    {command: "notify", description: "Toggle subscription notifications"},
    {command: "mysub", description: "View my subscription details"},
    {command: "feedback", description: "Provide feedback or report an issue"},
];

export const WeekDayToNumber: Record<Weekday, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0
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

