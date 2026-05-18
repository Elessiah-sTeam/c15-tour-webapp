import { useSyncExternalStore } from 'react';
import { saveStateStore } from './SaveStateStore';

export function useIsDirty(): boolean {
    return useSyncExternalStore(saveStateStore.subscribe, saveStateStore.getSnapshot);
}
