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

export class TimeSpan {
    private duration: number;
    private timespan: TimeSpanComposed;

    constructor(duration?: number) {
        if (duration)
            this.duration = duration;
        else
            this.duration = 0;
        this.timespan = TimeSpan.msToComposed(this.duration);
    }

    set(duration: number): void {
        this.duration = duration;
        this.timespan = TimeSpan.msToComposed(duration);
    }

    calculTimespan(dateA: Date, dataB: Date): void {
        this.duration = dateA.getTime() - dataB.getTime();
    }

    get(): number {
        return this.duration;
    }

    getTimeSpanComposed(): TimeSpanComposed {
        return this.timespan;
    }

    toString(precision: number, units?: unitTimeSpan): string {
        let result: string = '';
        if (!units)
            units = {days: ":", hours: ":", minutes: ":", seconds: ":", milliseconds: " "};

        switch (true) {
            // @ts-expect-error FallThrough attendu pour dérouler le résultat à partir de la précision
            case this.timespan.days != 0:
                result += this.timespan.days + units.days;
            // @ts-expect-error FallThrough attendu pour dérouler le résultat à partir de la précision
            case this.timespan.hours != 0 && precision > 0:
                result += this.timespan.hours + units.hours;
            // @ts-expect-error FallThrough attendu pour dérouler le résultat à partir de la précision
            case this.timespan.minutes != 0 && precision > 1:
                result += this.timespan.minutes + units.minutes;
            // @ts-expect-error FallThrough attendu pour dérouler le résultat à partir de la précision
            case this.timespan.seconds != 0 && precision > 2:
                result += this.timespan.seconds + units.seconds;
            // @ts-expect-error FallThrough attendu pour dérouler le résultat à partir de la précision
            case this.timespan.milliseconds != 0 && precision > 3:
                result += this.timespan.milliseconds + units.milliseconds;
                break;
            default:
                break;
        }
        return result;
    }

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
}