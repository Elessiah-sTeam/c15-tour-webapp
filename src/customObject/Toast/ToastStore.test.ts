import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toastStore, pushErrorToast, pushInfoToast, pushSuccessToast } from "./ToastStore";

// Couvre UX-03 : remontée des messages d'erreur / d'information à l'utilisateur.
describe("toastStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Vide les toasts résiduels d'autres tests.
        toastStore.getSnapshot().forEach((t) => toastStore.dismiss(t.id));
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("ajoute un toast avec le bon niveau et message", () => {
        pushErrorToast("Une erreur est survenue");
        const toasts = toastStore.getSnapshot();
        expect(toasts).toHaveLength(1);
        expect(toasts[0]).toMatchObject({ level: "error", message: "Une erreur est survenue" });
    });

    it("gère les trois niveaux de toast", () => {
        pushErrorToast("err");
        pushInfoToast("info");
        pushSuccessToast("ok");
        expect(toastStore.getSnapshot().map((t) => t.level)).toEqual(["error", "info", "success"]);
    });

    it("attribue des identifiants uniques", () => {
        const id1 = pushInfoToast("a");
        const id2 = pushInfoToast("b");
        expect(id1).not.toBe(id2);
    });

    it("retire un toast via dismiss()", () => {
        const id = pushInfoToast("à fermer");
        toastStore.dismiss(id);
        expect(toastStore.getSnapshot()).toHaveLength(0);
    });

    it("retire automatiquement le toast après 5 secondes", () => {
        pushInfoToast("auto");
        expect(toastStore.getSnapshot()).toHaveLength(1);
        vi.advanceTimersByTime(5000);
        expect(toastStore.getSnapshot()).toHaveLength(0);
    });

    it("notifie les abonnés lors d'un ajout", () => {
        const listener = vi.fn();
        const unsubscribe = toastStore.subscribe(listener);
        pushInfoToast("x");
        expect(listener).toHaveBeenCalled();
        unsubscribe();
    });
});
