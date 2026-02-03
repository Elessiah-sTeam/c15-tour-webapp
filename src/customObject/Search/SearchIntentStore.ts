import {useSyncExternalStore} from "react";

export type SearchTarget = {
    segmentId: string;
    stepId: string;
};

type SearchState = {
    target: SearchTarget | null;
    focusRequestId: number;
};

let state: SearchState = {
    target: null,
    focusRequestId: 0
};

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
}

export function subscribeSearchIntent(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getSearchIntentSnapshot(): SearchState {
    return state;
}

export function useSearchIntent() {
    return useSyncExternalStore(
        subscribeSearchIntent,
        getSearchIntentSnapshot
    );
}

export function requestSearchForStep(target: SearchTarget) {
    state = {
        target,
        focusRequestId: Date.now(),
    };
    emit();
}

export function clearSearchIntent() {
    state = {
        ...state,
        target: null,
    };
    emit();
}
