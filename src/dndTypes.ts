export type pdpInfo = {
    title: string;
    duration: Date;
}

export type DndItem = {
    id: string;
    content: pdpInfo;
}

export type stepInfo = {
    title: string;
    hour: Date;
    duration: Date;
}

export type DndCat = {
    id: string;
    content: stepInfo;
    items: DndItem[];
}