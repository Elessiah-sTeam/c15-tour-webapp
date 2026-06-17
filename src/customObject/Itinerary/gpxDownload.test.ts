import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadGpx } from "./gpx";

// Couvre EXP-03 : déclenchement du téléchargement GPX.
describe("downloadGpx()", () => {
    const segment = {
        geometry: { type: "LineString", coordinates: [[2.1, 48.1], [2.2, 48.2]] as [number, number][] },
    };

    beforeEach(() => {
        vi.stubGlobal("URL", {
            createObjectURL: vi.fn(() => "blob:fake-url"),
            revokeObjectURL: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("crée un lien de téléchargement avec l'extension .gpx et clique dessus", () => {
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

        downloadGpx("Mon convoi", [segment]);

        expect(window.URL.createObjectURL).toHaveBeenCalledOnce();
        expect(clickSpy).toHaveBeenCalledOnce();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    });

    it("nettoie le DOM après le téléchargement", () => {
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

        downloadGpx("Convoi", [segment]);

        expect(document.querySelector("a[download]")).toBeNull();
    });

    it("lève une erreur quand aucune géométrie n'est exploitable", () => {
        expect(() => downloadGpx("Vide", [{ geometry: undefined }])).toThrow();
    });
});
