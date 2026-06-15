import { describe, it, expect, vi, beforeEach } from "vitest";
import { reverseGeocode, shortenDisplayName } from "./geocode";

describe("shortenDisplayName()", () => {
  it("combine numéro + rue puis ville", () => {
    expect(shortenDisplayName("12, Rue de la Paix, Paris, France")).toBe("12 Rue de la Paix, Paris");
  });

  it("garde les deux premières parties sans numéro", () => {
    expect(shortenDisplayName("Tour Eiffel, Paris, France")).toBe("Tour Eiffel, Paris");
  });

  it("retourne la valeur seule s'il n'y a qu'une partie", () => {
    expect(shortenDisplayName("Paris")).toBe("Paris");
  });
});

describe("reverseGeocode()", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne l'adresse raccourcie en cas de succès", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_name: "12, Rue de la Paix, Paris, France" }),
    }));

    await expect(reverseGeocode(48.86, 2.33)).resolves.toBe("12 Rue de la Paix, Paris");
  });

  it("inclut lat/lon dans l'URL appelée", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_name: "Paris" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await reverseGeocode(48.86, 2.33);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("lat=48.86&lon=2.33"),
      expect.anything()
    );
  });

  it("retourne null si la réponse n'est pas ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    await expect(reverseGeocode(0, 0)).resolves.toBeNull();
  });

  it("retourne null si display_name est absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await expect(reverseGeocode(0, 0)).resolves.toBeNull();
  });
});
