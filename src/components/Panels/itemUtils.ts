export function formatPanelHour(hour?: Date): string {
    return `${hour?.getHours()}:${hour?.getMinutes().toString().padStart(2, "0")}`;
}
