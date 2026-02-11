export type TimeSpanComposed = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
}

export type unitTimeSpan = {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    milliseconds: string;
}

export const TimespanOffset = {
    DAYS: 0,
    HOURS: 1,
    MINUTES: 2,
    SECONDS: 3,
    MS: 4
} as const;

export type TimespanOffset =
    typeof TimespanOffset[keyof typeof TimespanOffset];

/**
 * Objet pour contenir facilement une durée
 */
export class TimeSpan {
    private _duration: number;
    private _timespan: TimeSpanComposed;

    /**
     * Construit un objet TimeSpan
     * @param duration en ms
     */
    constructor(duration?: number) {
        if (duration)
            this._duration = duration;
        else
            this._duration = 0;
        this._timespan = TimeSpan.msToComposed(this._duration);
    }

    /**
     * Redéfinie la durée
     * @param duration en ms
     */
    set(duration: number): void {
        this._duration = duration;
        this._timespan = TimeSpan.msToComposed(duration);
    }

    /**
     * Calcul la durée entre deux dates
     * @param dateA
     * @param dataB
     */
    calculTimespan(dateA: Date, dataB: Date): void {
        this._duration = dateA.getTime() - dataB.getTime();
    }


    /**
     * Récupère la durée en ms
     */
    get duration(): number {
        return this._duration;
    }

    /**
     * Récupère une version décomposé de la durée
     */
    getTimeSpanComposed(): TimeSpanComposed {
        return this._timespan;
    }

    /**
     * Renvoi une version formaté de la durée
     * @param precision Défini quoi afficher
     * @param units Défini les unités à afficher
     */
    toFStr(precision: TimespanOffset = TimespanOffset.MINUTES, units?: unitTimeSpan): string {
        let result: string = '';
        if (!units)
            units = {days: ":", hours: ":", minutes: ":", seconds: ":", milliseconds: " "};

        let start: TimespanOffset;
        if (this._timespan.days != 0)
            start = TimespanOffset.DAYS;
        else if (this._timespan.hours != 0)
            start = TimespanOffset.HOURS;
        else if (this._timespan.minutes != 0)
            start = TimespanOffset.MINUTES;
        else if (this._timespan.seconds != 0)
            start = TimespanOffset.SECONDS;
        else
            start = TimespanOffset.MS;

        if (start == TimespanOffset.DAYS)
            result += this._timespan.days + units.days;
        if ((start >= TimespanOffset.HOURS && precision > TimespanOffset.HOURS) || precision == TimespanOffset.HOURS)
            result += this._timespan.hours + units.hours;
        if ((start >= TimespanOffset.MINUTES && precision > TimespanOffset.MINUTES) || precision == TimespanOffset.MINUTES)
            result += this._timespan.minutes + units.minutes;
        if ((start >= TimespanOffset.SECONDS && precision > TimespanOffset.SECONDS) || precision == TimespanOffset.SECONDS)
            result += this._timespan.seconds + units.seconds;
        if ((start >= TimespanOffset.MS && precision > TimespanOffset.MS) || precision == TimespanOffset.MS)
            result += this._timespan.milliseconds + units.milliseconds;
        return result;
    }

    /**
     * Décompose les ms, pour récupérer simplement les heures par exemples
     * @param duration ms
     */
    public static msToComposed(duration: number): TimeSpanComposed {
        const timespan: TimeSpanComposed = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
        }
        let ms: number = duration;
        timespan.days = Math.floor(ms / 86_400_000);
        ms %= 86_400_000;

        timespan.hours = Math.floor(ms / 3_600_000);
        ms %= 3_600_000;

        timespan.minutes = Math.floor(ms / 60_000);
        ms %= 60_000;

        timespan.seconds = Math.floor(ms / 1_000);
        ms %= 1_000;

        timespan.milliseconds = ms;

        return timespan;
    }

    /**
     * Ajoute une durée à la durée actuelle
     * @param other Durée à ajouter
     */
    public add(other: TimeSpan): TimeSpan {
        this._duration += other._duration;
        this._timespan = this.getTimeSpanComposed();
        return this;
    }

    /**
     * Retire une durée à la durée actuelle
     * @param other Durée à retirer
     */
    public sub(other: TimeSpan): TimeSpan {
        this._duration -= other._duration;
        this._timespan = this.getTimeSpanComposed();
        return this;
    }
}