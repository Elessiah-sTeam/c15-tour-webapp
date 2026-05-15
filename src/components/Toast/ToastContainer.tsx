import { toastStore } from "../../customObject/Toast/ToastStore.ts";
import { useToasts } from "../../customObject/Toast/useToasts.ts";
import "./ToastContainer.css";

export default function ToastContainer() {
    const toasts = useToasts(toastStore);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast-container" role="region" aria-live="polite">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.level}`}
                    role={toast.level === "error" ? "alert" : "status"}
                    onClick={() => toastStore.dismiss(toast.id)}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
