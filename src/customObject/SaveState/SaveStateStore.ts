type SaveStateListener = () => void;

type SaveStateStore = {
    getSnapshot(): boolean;
    subscribe(l: SaveStateListener): () => void;
    set(updater: (prev: boolean) => boolean): void;
};

function createSaveStateStore(initial = false): SaveStateStore {
    let isDirty = initial;
    const listeners = new Set<SaveStateListener>();

    return {
        getSnapshot: () => isDirty,
        subscribe: (l: SaveStateListener) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        set(updater: (prev: boolean) => boolean) {
            isDirty = updater(isDirty);
            listeners.forEach(l => l());
        },
    };
}

export const saveStateStore = createSaveStateStore(false);
