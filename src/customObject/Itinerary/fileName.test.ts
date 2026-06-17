import { describe, it, expect } from "vitest";
import { sanitizeFileName } from "./fileName";

// Couvre EXP-01/EXP-03 : nommage des fichiers exportés (PDF / GPX).
describe("sanitizeFileName()", () => {
    it("conserve un nom simple", () => {
        expect(sanitizeFileName("Mon convoi")).toBe("Mon-convoi");
    });

    it("remplace les caractères interdits par le système de fichiers", () => {
        expect(sanitizeFileName('Tour:<>"/\\|?*2026')).toBe("Tour-2026");
    });

    it("supprime les accents", () => {
        expect(sanitizeFileName("Été à Nîmes")).toBe("Ete-a-Nimes");
    });

    it("normalise les espaces multiples en un seul tiret", () => {
        expect(sanitizeFileName("A    B   C")).toBe("A-B-C");
    });

    it("retire les tirets en début et fin", () => {
        expect(sanitizeFileName("  convoi  ")).toBe("convoi");
    });

    it("retourne 'itinerary' quand le nom est vide", () => {
        expect(sanitizeFileName("")).toBe("itinerary");
        expect(sanitizeFileName("***")).toBe("itinerary");
    });
});
