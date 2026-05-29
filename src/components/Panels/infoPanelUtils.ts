import { TimeSpan, TimespanOffset, type unitTimeSpan } from "../../customObject/TimeSpan.ts";

export function formatTotalPauseDuration(totalPauseSeconds: number, units: unitTimeSpan): string {
    return new TimeSpan(totalPauseSeconds * 1000).toFStr(TimespanOffset.MINUTES, units);
}
