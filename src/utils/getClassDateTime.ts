export const getClassDateTime = (date: Date, timeString: string): Date | null => {
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