import type {DeleteModStore} from "./types.ts";
import {useSyncExternalStore} from "react";

export function useDeleteMod(store: DeleteModStore) {
    return useSyncExternalStore(
        store.subscribe,
        store.getSnapshot
    );
}