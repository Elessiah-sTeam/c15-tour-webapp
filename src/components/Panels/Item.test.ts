import { describe, expect, it } from "vitest";
import { formatPanelHour } from "./Item";

describe("formatPanelHour()", () => {
  it("affiche les minutes sur deux chiffres", () => {
    expect(formatPanelHour(new Date(2024, 5, 1, 12, 5))).toBe("12:05");
  });

  it("affiche une heure d'arrivee classique", () => {
    expect(formatPanelHour(new Date(2024, 5, 1, 12, 20))).toBe("12:20");
  });
});
