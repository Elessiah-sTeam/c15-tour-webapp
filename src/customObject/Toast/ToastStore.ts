import type { Toast, ToastLevel, ToastListener, ToastStore } from "./types.ts";

const DEFAULT_DURATION_MS = 5000;

function createToastStore(): ToastStore {
    let toasts: readonly Toast[] = [];
    const listeners = new Set<ToastListener>();
    let nextId = 1;

    const emit = () => listeners.forEach(l => l());

    const dismiss = (id: number) => {
        const next = toasts.filter(t => t.id !== id);
        if (next.length !== toasts.length) {
            toasts = next;
            emit();
        }
    };

    return {
        getSnapshot: () => toasts,
        subscribe: (l: ToastListener) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        push(level: ToastLevel, message: string) {
            const id = nextId++;
            toasts = [...toasts, { id, level, message }];
            emit();
            setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
            return id;
        },
        dismiss,
    };
}

export const toastStore = createToastStore();

export const pushErrorToast = (message: string) => toastStore.push("error", message);
export const pushInfoToast = (message: string) => toastStore.push("info", message);
export const pushSuccessToast = (message: string) => toastStore.push("success", message);
