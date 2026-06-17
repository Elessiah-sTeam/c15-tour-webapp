import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomeLanding from "./HomeLanding";

// Couvre ACC-01 (affichage accueil), ACC-02 (créer un convoi),
// ACC-03 (accéder historique) et ACC-04 (design cohérent C15 Tour).
describe("HomeLanding", () => {
    it("affiche le titre de marque C15 (ACC-04)", () => {
        render(<HomeLanding />);
        // Texte exact pour cibler le bandeau de marque (et non le message de bienvenue).
        expect(screen.getByText("C15 Fiesta Tour")).toBeInTheDocument();
    });

    it("affiche les deux actions principales (ACC-01)", () => {
        render(<HomeLanding />);
        expect(screen.getByText("Créer un nouveau convoi")).toBeInTheDocument();
        expect(screen.getByText(/Accéder à l'historique des convois/i)).toBeInTheDocument();
    });

    it("déclenche onCreateNew au clic sur « Créer un nouveau convoi » (ACC-02)", async () => {
        const onCreateNew = vi.fn();
        const user = userEvent.setup();
        render(<HomeLanding onCreateNew={onCreateNew} />);

        await user.click(screen.getByText("Créer un nouveau convoi"));
        expect(onCreateNew).toHaveBeenCalledOnce();
    });

    it("déclenche onOpenHistory au clic sur l'historique (ACC-03)", async () => {
        const onOpenHistory = vi.fn();
        const user = userEvent.setup();
        render(<HomeLanding onOpenHistory={onOpenHistory} />);

        await user.click(screen.getByText(/Accéder à l'historique des convois/i));
        expect(onOpenHistory).toHaveBeenCalledOnce();
    });

    it("ouvre les paramètres du compte", async () => {
        const onOpenAccountSettings = vi.fn();
        const user = userEvent.setup();
        render(<HomeLanding onOpenAccountSettings={onOpenAccountSettings} />);

        await user.click(screen.getByRole("button", { name: /paramètres du compte/i }));
        expect(onOpenAccountSettings).toHaveBeenCalledOnce();
    });
});
