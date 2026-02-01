export type DeleteModStore = {
    getSnapshot(): boolean;
    subscribe(l: () => void): () => void;
    set(updater: (prev: boolean) => boolean): void;
}

export type DeleteModListener = () => void;