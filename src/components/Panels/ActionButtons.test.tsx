import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockItinerary = {
    id: 1,
    name: 'Convoi test',
    shareCode: '',
    organiserCode: '',
    segments: [{ id: 'seg-1', content: { geometry: { type: 'Feature' } } }],
};

vi.mock('../../customObject/Itinerary/UseItinerary', () => ({
    useItinerary: () => mockItinerary,
}));
vi.mock('../../customObject/DeleteMod/useDeleteMod', () => ({
    useDeleteMod: () => false,
}));
vi.mock('../../customObject/SaveState/useIsDirty', () => ({
    useIsDirty: () => false,
}));
vi.mock('../../customObject/DeleteMod/DeleteModStore', () => ({
    deleteModStore: { set: vi.fn() },
}));
vi.mock('../../customObject/Itinerary/ItineraryStore', () => ({
    itineraryModel: { store: {}, netModel: {} },
}));

const { downloadGpx, hasGpxGeometry, downloadItineraryPdf } = vi.hoisted(() => ({
    downloadGpx: vi.fn(),
    hasGpxGeometry: vi.fn(() => true),
    downloadItineraryPdf: vi.fn(() => Promise.resolve()),
}));
vi.mock('../../customObject/Itinerary/gpx', () => ({
    downloadGpx,
    hasGpxGeometry,
}));
vi.mock('../../customObject/Itinerary/pdf', () => ({
    downloadItineraryPdf,
    collectPdfSections: () => [{}],
}));

import ActionButtons from './ActionButtons';

describe('ActionButtons export menu', () => {
    beforeEach(() => {
        downloadGpx.mockClear();
        downloadItineraryPdf.mockClear();
        hasGpxGeometry.mockReturnValue(true);
    });

    it('ouvre un menu avec les options GPX et PDF', async () => {
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByLabelText("Exporter l'itinéraire"));

        expect(screen.getByText('Télécharger le GPX')).toBeInTheDocument();
        expect(screen.getByText('Exporter en PDF')).toBeInTheDocument();
    });

    it('déclenche le téléchargement GPX', async () => {
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByLabelText("Exporter l'itinéraire"));
        await user.click(screen.getByText('Télécharger le GPX'));

        expect(downloadGpx).toHaveBeenCalledTimes(1);
    });

    it("déclenche l'export PDF", async () => {
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByLabelText("Exporter l'itinéraire"));
        await user.click(screen.getByText('Exporter en PDF'));

        expect(downloadItineraryPdf).toHaveBeenCalledTimes(1);
    });

    it('désactive l\'option GPX sans géométrie', async () => {
        hasGpxGeometry.mockReturnValue(false);
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByLabelText("Exporter l'itinéraire"));

        expect(screen.getByText('Téléchargement GPX indisponible').closest('button')).toBeDisabled();
    });
});

describe('ActionButtons share menu', () => {
    beforeEach(() => {
        mockItinerary.shareCode = 'MEMBER1';
        mockItinerary.organiserCode = 'ORGA1';
    });

    it('propose le partage du code membre et du code orga', async () => {
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByRole('button', { name: /^partager$/i }));

        expect(screen.getByText('Partager le code membre')).toBeInTheDocument();
        expect(screen.getByText('Partager le code orga')).toBeInTheDocument();
    });

    it('affiche le code orga dans la modale de partage', async () => {
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByRole('button', { name: /^partager$/i }));
        await user.click(screen.getByText('Partager le code orga'));

        expect(screen.getByText('ORGA1')).toBeInTheDocument();
        expect(screen.getByText('Code orga :')).toBeInTheDocument();
    });

    it('désactive le choix code orga quand il est absent', async () => {
        mockItinerary.organiserCode = '';
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByRole('button', { name: /^partager$/i }));

        expect(screen.getByText('Partager le code orga').closest('button')).toBeDisabled();
    });
});
