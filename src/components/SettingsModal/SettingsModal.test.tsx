import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "./SettingsModal";
import type { GlobalSettings } from "./settingsTypes";

const baseSettings: GlobalSettings = {
    convoyName: "Convoi initial",
    departureDate: "2026-06-17",
    departureTime: "08:00",
    speedPercentage: 100,
    minSegmentDuration: 1,
    maxSegmentDuration: 4,
    pauseConfigs: [],
};

// Couvre PARAM-01..06 : ouverture, modification vitesse / durée max, validation, annulation.
describe("SettingsModal", () => {
    it("ne rend rien quand elle est fermée (PARAM-01)", () => {
        const { container } = render(
            <SettingsModal isOpen={false} onClose={() => {}} onSave={() => {}} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("affiche le panneau de paramètres globaux quand ouverte (PARAM-01)", () => {
        render(<SettingsModal isOpen onClose={() => {}} onSave={() => {}} initialSettings={baseSettings} />);
        expect(screen.getByText("Paramètres globaux")).toBeInTheDocument();
        expect(screen.getByLabelText("Nom du convoi")).toHaveValue("Convoi initial");
    });

    it("modifie le pourcentage de vitesse moyenne (PARAM-02)", async () => {
        const onSave = vi.fn();
        const user = userEvent.setup();
        render(<SettingsModal isOpen onClose={() => {}} onSave={onSave} initialSettings={baseSettings} />);

        const slider = screen.getByRole("slider");
        fireEvent.change(slider, { target: { value: "80" } });
        expect(screen.getByText(/limites de vitesse : 80%/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /enregistrer/i }));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ speedPercentage: 80 }));
    });

    it("modifie la durée maximale d'un segment (PARAM-03)", async () => {
        const onSave = vi.fn();
        const user = userEvent.setup();
        render(<SettingsModal isOpen onClose={() => {}} onSave={onSave} initialSettings={baseSettings} />);

        const maxDuration = screen.getByLabelText("Durée maximale (heures)");
        await user.clear(maxDuration);
        await user.type(maxDuration, "6");
        await user.click(screen.getByRole("button", { name: /enregistrer/i }));

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ maxSegmentDuration: 6 }));
    });

    it("valide et applique les paramètres puis ferme (PARAM-05)", async () => {
        const onSave = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<SettingsModal isOpen onClose={onClose} onSave={onSave} initialSettings={baseSettings} />);

        const nameInput = screen.getByLabelText("Nom du convoi");
        await user.clear(nameInput);
        await user.type(nameInput, "Tour2026");
        await user.click(screen.getByRole("button", { name: /enregistrer/i }));

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ convoyName: "Tour2026" }));
        expect(onClose).toHaveBeenCalled();
    });

    it("annule sans sauvegarder, conserve les anciennes valeurs (PARAM-06)", async () => {
        const onSave = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<SettingsModal isOpen onClose={onClose} onSave={onSave} initialSettings={baseSettings} />);

        await user.clear(screen.getByLabelText("Nom du convoi"));
        await user.type(screen.getByLabelText("Nom du convoi"), "Jeté");
        await user.click(screen.getByRole("button", { name: /annuler/i }));

        expect(onSave).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it("indique l'absence de pauses tant qu'aucune n'est définie", () => {
        render(<SettingsModal isOpen onClose={() => {}} onSave={() => {}} initialSettings={baseSettings} />);
        expect(screen.getByText(/pauses apparaîtront ici/i)).toBeInTheDocument();
    });
});
