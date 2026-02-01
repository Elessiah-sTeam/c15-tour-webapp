import type {DeleteModListener, DeleteModStore} from "./types.ts";

function createDeleteModStore(initial: boolean = false) : DeleteModStore
{
    let deleteMod: boolean = initial;
    const listeners = new Set<DeleteModListener>();

    return {
        getSnapshot: () => deleteMod,
        subscribe: (l: DeleteModListener) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        set(updater: (r: boolean) => boolean) {
            deleteMod = updater(deleteMod);
            listeners.forEach(l => l());
        }
    }
}

export const deleteModStore = createDeleteModStore(false);