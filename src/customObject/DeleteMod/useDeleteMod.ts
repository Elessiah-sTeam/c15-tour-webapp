import type {DeleteModStore} from "./types.ts";
import {useSyncExternalStore} from "react";

/**
 * Permet de récupérer le snapshot de DeleteMod
 * et d'abonner le composant qui l'appelle à ses changements
 * @param store
 */
export function useDeleteMod(store: DeleteModStore) {
    return useSyncExternalStore(
        store.subscribe,
        store.getSnapshot
    );
}