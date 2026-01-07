import type {TimeSpan} from "./customObject/TimeSpan.ts";

export type pdpInfo = {
    title: string;
    duration: TimeSpan;
}

export type DndItem = {
    id: string;
    content: pdpInfo;
}

export type stepInfo = {
    title: string;
    hour: Date;
    duration: TimeSpan;
}

export type DndCat = {
    id: string;
    content: stepInfo;
    isStartEnd: boolean;
    items: DndItem[];
}