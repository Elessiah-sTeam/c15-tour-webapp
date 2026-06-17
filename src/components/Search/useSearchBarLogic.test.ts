import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { useSearchBarLogic } from "./useSearchBarLogic";

// react-leaflet useMap requiert un contexte de carte ; on le neutralise.
const flyTo = vi.fn();
vi.mock("react-leaflet", () => ({ useMap: () => ({ flyTo }) }));

function makeRefs() {
    return {
        formRef: createRef<HTMLFormElement>(),
        listRef: createRef<HTMLUListElement>(),
        inputRef: createRef<HTMLInputElement>(),
    };
}

function renderSearch() {
    const onLocationSelected = vi.fn();
    const refs = makeRefs();
    const view = renderHook(() => useSearchBarLogic({ onLocationSelected, refs }));
    return { ...view, onLocationSelected };
}

// Déclenche le debounce (250ms) puis laisse résoudre le fetch.
async function runDebouncedSearch(handleChange: (v: string) => void, value: string) {
    act(() => handleChange(value));
    await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
    });
}

// Couvre WEB-02 (recherche d'adresse), WEB-04 (recherche sans résultat).
describe("useSearchBarLogic", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        flyTo.mockReset();
    });
    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("renvoie les résultats de recherche d'adresse (WEB-02)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ lat: "48.85", lon: "2.35", display_name: "Paris, France" }],
        }));

        const { result } = renderSearch();
        await runDebouncedSearch(result.current.handlers.handleChange, "Paris");

        expect(result.current.state.results).toHaveLength(1);
        expect(result.current.state.results[0].display_name).toBe("Paris, France");
        expect(result.current.state.error).toBeNull();
    });

    it("affiche « Lieu introuvable » sans résultat (WEB-04)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));

        const { result } = renderSearch();
        await runDebouncedSearch(result.current.handlers.handleChange, "zzzzzzz");

        expect(result.current.state.error).toBe("Lieu introuvable");
        expect(result.current.state.results).toHaveLength(0);
    });

    it("dédoublonne les résultats par nom", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                { lat: "1", lon: "1", display_name: "Lyon" },
                { lat: "1", lon: "1", display_name: "Lyon" },
                { lat: "2", lon: "2", display_name: "Nantes" },
            ],
        }));

        const { result } = renderSearch();
        await runDebouncedSearch(result.current.handlers.handleChange, "ville");

        expect(result.current.state.results).toHaveLength(2);
    });

    it("vide les résultats quand la requête est effacée", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{ lat: "1", lon: "1", display_name: "Lyon" }],
        }));

        const { result } = renderSearch();
        await runDebouncedSearch(result.current.handlers.handleChange, "Lyon");
        expect(result.current.state.results).toHaveLength(1);

        act(() => result.current.handlers.handleChange(""));
        expect(result.current.state.results).toHaveLength(0);
    });
});
