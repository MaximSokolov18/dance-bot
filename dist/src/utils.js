function getWeekdayNumber(day) {
    const dayMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6
    };
    return dayMap[day];
}
export function calculateNextPaymentDate(classDays, remainingLessons) {
    const classWeekDays = classDays.map(getWeekdayNumber);
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    if (remainingLessons <= 0) {
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
export function getTotalLessons(type) {
    switch (type) {
        case "EightLessons": return 8;
        case "FourLessons": return 4;
        case "OneLesson": return 1;
        case "Trial": return 1;
        default: return 0;
    }
}
export function formatGroupName(type) {
    switch (type) {
        case "JazzFunk": return "Jazz Funk";
        case "HighHeels": return "High Heels";
        default: return type;
    }
}
export function calculateUsedLessons(startDate, classDays) {
    const today = new Date();
    const start = new Date(startDate);
    const classWeekDays = classDays.map(getWeekdayNumber);
    let classesOccurred = 0;
    const currentDay = new Date(start);
    while (currentDay <= today) {
        if (classWeekDays.includes(currentDay.getDay())) {
            classesOccurred++;
        }
        currentDay.setDate(currentDay.getDate() + 1);
    }
    return classesOccurred;
}
export function formatSubscriptionType(type) {
    switch (type) {
        case "EightLessons": return "8 Lessons Package";
        case "FourLessons": return "4 Lessons Package";
        case "OneLesson": return "Single Lesson";
        case "Trial": return "Trial Lesson";
        default: return type;
    }
}
export function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
//# sourceMappingURL=utils.js.map