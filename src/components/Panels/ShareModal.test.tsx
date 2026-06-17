import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareModal from "./ShareModal";

// Couvre SHARE-01 (code participant), SHARE-03 (QR code) et SHARE-04 (copier le code).
describe("ShareModal", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("affiche le code de partage", () => {
        render(<ShareModal shareCode="ABC123" onClose={() => {}} />);
        expect(screen.getByText("ABC123")).toBeInTheDocument();
        expect(screen.getByText("Partager le convoi")).toBeInTheDocument();
    });

    it("affiche un QR code (SVG) contenant le code", () => {
        render(<ShareModal shareCode="QR-CODE-42" onClose={() => {}} />);
        // La modale est rendue dans un portail (document.body) ; qrcode.react rend un <svg>.
        expect(document.body.querySelector(".share-qr-container svg")).toBeInTheDocument();
    });

    it("copie le code dans le presse-papier au clic", async () => {
        // userEvent.setup() fournit un presse-papier simulé que l'on relit ensuite.
        const user = userEvent.setup();

        render(<ShareModal shareCode="COPY-ME" onClose={() => {}} />);
        await user.click(screen.getByRole("button", { name: /copier le code/i }));

        expect(await navigator.clipboard.readText()).toBe("COPY-ME");
        // Le bouton reste accessible après la confirmation visuelle (icône Check).
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /copier le code/i })).toBeInTheDocument();
        });
    });

    it("ferme la modale via le bouton fermer", async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<ShareModal shareCode="X" onClose={onClose} />);

        await user.click(screen.getAllByRole("button", { name: /fermer/i })[0]);
        expect(onClose).toHaveBeenCalled();
    });

    it("ferme la modale avec la touche Échap", async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<ShareModal shareCode="X" onClose={onClose} />);

        await user.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalled();
    });
});
