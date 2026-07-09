import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItineraryCard } from "./ItineraryCard";
import type { ItineraryResponse } from "../../customObject/Itinerary/netTypes";

// ConvoyThumbnail rend un canvas/leaflet-like ; on le neutralise pour isoler la carte.
vi.mock("./ConvoyThumbnail", () => ({
    ConvoyThumbnail: () => <div data-testid="thumb" />,
}));

const geometry = JSON.stringify({ type: "LineString", coordinates: [[2.1, 48.1], [2.2, 48.2]] });

function buildItinerary(overrides: Partial<ItineraryResponse> = {}): ItineraryResponse {
    return {
        id: 7,
        name: "Convoi Bretagne",
        shareCode: "SHARE7",
        totalDistance: 120000,
        totalDuration: 7200,
        draft: false,
        segments: [
            { name: "S1", distance: 120000, duration: 7200, geometry, waypoints: [
                { name: "Rennes", coordinates: { latitude: 48.1, longitude: -1.6 } },
                { name: "Brest", coordinates: { latitude: 48.4, longitude: -4.5 } },
            ] },
        ],
        ...overrides,
    };
}

function setup(overrides: Partial<ItineraryResponse> = {}, props: Partial<Parameters<typeof ItineraryCard>[0]> = {}) {
    const handlers = {
        onOpen: vi.fn(),
        onDelete: vi.fn(),
        onShare: vi.fn(),
        onExportPdf: vi.fn(),
    };
    render(<ItineraryCard itinerary={buildItinerary(overrides)} {...handlers} {...props} />);
    return handlers;
}

describe("ItineraryCard", () => {
    beforeEach(() => vi.restoreAllMocks());

    it("affiche le nom, le trajet et les statistiques (HIST-01)", () => {
        setup();
        expect(screen.getByText("Convoi Bretagne")).toBeInTheDocument();
        expect(screen.getByText(/Rennes/)).toBeInTheDocument();
        expect(screen.getByText(/Brest/)).toBeInTheDocument();
        expect(screen.getByText("2 points")).toBeInTheDocument();
        expect(screen.getByText("120 km")).toBeInTheDocument();
        expect(screen.getByText("2h00")).toBeInTheDocument();
    });

    it("affiche le badge Finalisé ou Brouillon (HIST-08)", () => {
        setup({ draft: false });
        expect(screen.getByText("Finalisé")).toBeInTheDocument();
    });

    it("affiche le badge Brouillon pour un convoi en brouillon (HIST-08)", () => {
        setup({ draft: true });
        expect(screen.getByText("Brouillon")).toBeInTheDocument();
    });

    it("ouvre le convoi au clic sur Ouvrir (HIST-03)", async () => {
        const user = userEvent.setup();
        const { onOpen } = setup();
        await user.click(screen.getByRole("button", { name: /Ouvrir/ }));
        expect(onOpen).toHaveBeenCalledWith(7);
    });

    it("supprime le convoi au clic sur la corbeille (HIST-04)", async () => {
        const user = userEvent.setup();
        const { onDelete } = setup();
        await user.click(screen.getByRole("button", { name: /supprimer/i }));
        expect(onDelete).toHaveBeenCalledWith(7);
    });

    it("partage le code membre via le menu de partage (SHARE)", async () => {
        const user = userEvent.setup();
        const { onShare } = setup({ organiserCode: "ORGA7" });
        await user.click(screen.getByRole("button", { name: /^partager$/i }));
        await user.click(screen.getByRole("menuitem", { name: /code membre/i }));
        expect(onShare).toHaveBeenCalledWith("SHARE7", "Code membre");
    });

    it("partage le code orga via le menu de partage (SHARE)", async () => {
        const user = userEvent.setup();
        const { onShare } = setup({ organiserCode: "ORGA7" });
        await user.click(screen.getByRole("button", { name: /^partager$/i }));
        await user.click(screen.getByRole("menuitem", { name: /code orga/i }));
        expect(onShare).toHaveBeenCalledWith("ORGA7", "Code orga");
    });

    it("désactive le choix code orga quand il est absent", async () => {
        const user = userEvent.setup();
        setup({ organiserCode: undefined });
        await user.click(screen.getByRole("button", { name: /^partager$/i }));
        expect(screen.getByRole("menuitem", { name: /code orga/i })).toBeDisabled();
    });

    it("désactive le partage sans aucun code", () => {
        setup({ shareCode: undefined, organiserCode: undefined });
        expect(screen.getByRole("button", { name: /partage indisponible/i })).toBeDisabled();
    });

    it("exporte en PDF (EXP-01)", async () => {
        const user = userEvent.setup();
        const { onExportPdf } = setup();
        await user.click(screen.getByRole("button", { name: /exporter en pdf/i }));
        expect(onExportPdf).toHaveBeenCalledWith(7);
    });

    it("désactive l'export PDF pendant la génération", () => {
        setup({}, { isExportingPdf: true });
        expect(screen.getByRole("button", { name: /génération du pdf/i })).toBeDisabled();
    });

    it("désactive le GPX quand aucune géométrie n'est disponible (EXP-03)", () => {
        setup({ segments: [{ name: "S", distance: 0, duration: 0, geometry: "", waypoints: [] }] });
        expect(screen.getByRole("button", { name: /indisponible/i })).toBeInTheDocument();
    });
});
