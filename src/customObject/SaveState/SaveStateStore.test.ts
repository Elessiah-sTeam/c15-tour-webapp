import { describe, it, expect, vi, afterEach } from "vitest";
import { saveStateStore } from "./SaveStateStore";

// Couvre SAVE-03 : suivi de l'état "modifications non sauvegardées" (dirty).
describe("saveStateStore", () => {
    afterEach(() => {
        saveStateStore.set(() => false);
    });

    it("démarre dans un état propre (non dirty)", () => {
        expect(saveStateStore.getSnapshot()).toBe(false);
    });

    it("passe à dirty via set()", () => {
        saveStateStore.set(() => true);
        expect(saveStateStore.getSnapshot()).toBe(true);
    });

    it("expose la valeur précédente à l'updater", () => {
        saveStateStore.set(() => true);
        saveStateStore.set((prev) => !prev);
        expect(saveStateStore.getSnapshot()).toBe(false);
    });

    it("notifie les abonnés à chaque changement", () => {
        const listener = vi.fn();
        const unsubscribe = saveStateStore.subscribe(listener);

        saveStateStore.set(() => true);
        saveStateStore.set(() => false);

        expect(listener).toHaveBeenCalledTimes(2);
        unsubscribe();
    });

    it("n'appelle plus un abonné après désinscription", () => {
        const listener = vi.fn();
        const unsubscribe = saveStateStore.subscribe(listener);
        unsubscribe();

        saveStateStore.set(() => true);

        expect(listener).not.toHaveBeenCalled();
    });
});
