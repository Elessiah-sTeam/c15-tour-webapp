import { useSyncExternalStore } from "react";
import type { ToastStore } from "./types.ts";

export function useToasts(store: ToastStore) {
    return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
