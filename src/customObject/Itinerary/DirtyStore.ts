type DirtyListener = () => void;

type DirtyStore = {
    getSnapshot(): boolean;
    subscribe(l: DirtyListener): () => void;
    set(value: boolean): void;
};

function createDirtyStore(initial: boolean = false): DirtyStore {
    let dirty = initial;
    const listeners = new Set<DirtyListener>();

    return {
        getSnapshot: () => dirty,
        subscribe: (l: DirtyListener) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        set(value: boolean) {
            if (dirty === value) return;
            dirty = value;
            listeners.forEach(l => l());
        }
    };
}

export const dirtyStore = createDirtyStore(false);
