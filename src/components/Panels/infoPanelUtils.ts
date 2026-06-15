import { TimeSpan, TimespanOffset, type unitTimeSpan } from "../../customObject/TimeSpan.ts";

/** Libellés d'unités partagés pour l'affichage des pauses (InfoPanel et PauseLine). */
export const PAUSE_UNITS: unitTimeSpan = { days: "J ", hours: "H ", minutes: "MIN ", seconds: "S ", milliseconds: "MS " };

/**
 * Formate une durée de pause exprimée en secondes en chaîne lisible (ex. "30 MIN").
 * @param totalPauseSeconds durée de la pause en secondes
 * @param units libellés d'unités à utiliser (PAUSE_UNITS par défaut)
 */
export function formatTotalPauseDuration(totalPauseSeconds: number, units: unitTimeSpan = PAUSE_UNITS): string {
    return new TimeSpan(totalPauseSeconds * 1000).toFStr(TimespanOffset.MINUTES, units);
}
