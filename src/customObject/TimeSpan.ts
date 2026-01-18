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

    toFStr(precision: TimespanOffset = TimespanOffset.MINUTES, units?: unitTimeSpan): string {
        let result: string = '';
        if (!units)
            units = {days: ":", hours: ":", minutes: ":", seconds: ":", milliseconds: " "};

        let start: TimespanOffset;
        if (this.timespan.days != 0)
            start = TimespanOffset.DAYS;
        else if (this.timespan.hours != 0)
            start = TimespanOffset.HOURS;
        else if (this.timespan.minutes != 0)
            start = TimespanOffset.MINUTES;
        else if (this.timespan.seconds != 0)
            start = TimespanOffset.SECONDS;
        else
            start = TimespanOffset.MS;

        if (start == TimespanOffset.DAYS)
            result += this.timespan.days + units.days;
        if ((start >= TimespanOffset.HOURS && precision > TimespanOffset.HOURS) || precision == TimespanOffset.HOURS)
            result += this.timespan.hours + units.hours;
        if ((start >= TimespanOffset.MINUTES && precision > TimespanOffset.MINUTES) || precision == TimespanOffset.MINUTES)
            result += this.timespan.minutes + units.minutes;
        if ((start >= TimespanOffset.SECONDS && precision > TimespanOffset.SECONDS) || precision == TimespanOffset.SECONDS)
            result += this.timespan.seconds + units.seconds;
        if ((start >= TimespanOffset.MS && precision > TimespanOffset.MS) || precision == TimespanOffset.MS)
            result += this.timespan.milliseconds + units.milliseconds;
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

    public add(other: TimeSpan): TimeSpan {
        this.duration += other.duration;
        this.timespan = this.getTimeSpanComposed();
        return this;
    }

    public sub(other: TimeSpan): TimeSpan {
        this.duration -= other.duration;
        this.timespan = this.getTimeSpanComposed();
        return this;
    }
}