import { TimeSpan, TimespanOffset, type unitTimeSpan } from "../../customObject/TimeSpan.ts";

export const PAUSE_UNITS: unitTimeSpan = { days: "J ", hours: "H ", minutes: "MIN ", seconds: "S ", milliseconds: "MS " };

export function formatTotalPauseDuration(totalPauseSeconds: number, units: unitTimeSpan = PAUSE_UNITS): string {
    return new TimeSpan(totalPauseSeconds * 1000).toFStr(TimespanOffset.MINUTES, units);
}
