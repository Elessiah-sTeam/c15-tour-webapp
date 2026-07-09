import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockItinerary = {
    id: 1,
    name: 'Convoi test',
    shareCode: '',
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
const { saveAsDraft, saveAsFinalized } = vi.hoisted(() => ({
    saveAsDraft: vi.fn(() => Promise.resolve()),
    saveAsFinalized: vi.fn(() => Promise.resolve()),
}));
vi.mock('../../customObject/Itinerary/ItineraryStore', () => ({
    itineraryModel: { store: {}, netModel: { saveAsDraft, saveAsFinalized } },
}));

const { pushErrorToast } = vi.hoisted(() => ({
    pushErrorToast: vi.fn(),
}));
vi.mock('../../customObject/Toast/ToastStore', () => ({
    pushErrorToast,
}));

const { findSegmentDurationViolations, buildSegmentDurationErrorMessage } = vi.hoisted(() => ({
    findSegmentDurationViolations: vi.fn(() => []),
    buildSegmentDurationErrorMessage: vi.fn(() => 'Segment hors bornes'),
}));
vi.mock('../../customObject/Itinerary/segmentDurationValidation', () => ({
    findSegmentDurationViolations,
    buildSegmentDurationErrorMessage,
}));

vi.mock('../SettingsModal/settingsStorage', () => ({
    loadGlobalSettings: () => ({ minSegmentDuration: 1, maxSegmentDuration: 4 }),
    persistGlobalSettings: vi.fn(),
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

describe('ActionButtons sauvegarde et durée des segments', () => {
    beforeEach(() => {
        saveAsDraft.mockClear();
        saveAsFinalized.mockClear();
        pushErrorToast.mockClear();
        findSegmentDurationViolations.mockReturnValue([]);
    });

    it('enregistre le convoi quand toutes les durées sont valides', async () => {
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

        expect(saveAsFinalized).toHaveBeenCalledTimes(1);
        expect(pushErrorToast).not.toHaveBeenCalled();
    });

    it('bloque la sauvegarde et affiche une erreur quand un segment est hors bornes', async () => {
        findSegmentDurationViolations.mockReturnValue([
            { segmentName: 'Segment a', durationLabel: '5h00', kind: 'max' },
        ]);
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

        expect(saveAsFinalized).not.toHaveBeenCalled();
        expect(pushErrorToast).toHaveBeenCalledWith('Segment hors bornes');
    });

    it('bloque aussi la sauvegarde en brouillon', async () => {
        findSegmentDurationViolations.mockReturnValue([
            { segmentName: 'Segment a', durationLabel: '0h30', kind: 'min' },
        ]);
        const user = userEvent.setup();
        render(<ActionButtons />);

        await user.click(screen.getByRole('button', { name: 'Brouillon' }));

        expect(saveAsDraft).not.toHaveBeenCalled();
        expect(pushErrorToast).toHaveBeenCalledTimes(1);
    });
});
