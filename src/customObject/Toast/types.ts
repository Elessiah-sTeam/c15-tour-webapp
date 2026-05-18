export type ToastLevel = "info" | "success" | "error";

export type Toast = {
    id: number;
    level: ToastLevel;
    message: string;
};

export type ToastListener = () => void;

export type ToastStore = {
    getSnapshot(): readonly Toast[];
    subscribe(l: ToastListener): () => void;
    push(level: ToastLevel, message: string): number;
    dismiss(id: number): void;
};
