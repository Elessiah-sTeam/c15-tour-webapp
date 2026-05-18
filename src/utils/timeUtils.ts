export function isValidDate(date: Date | undefined): date is Date {
    return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * Formatte une date en heure lisible (HH:MM)
 */
export function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}