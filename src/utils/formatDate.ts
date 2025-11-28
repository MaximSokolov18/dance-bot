export const formatDate = (date: Date, languageCode: string = 'en'): string => {
    const localeMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'uk': 'uk-UA'
    };
    
    const locale = localeMap[languageCode] || 'en-US';
    
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}