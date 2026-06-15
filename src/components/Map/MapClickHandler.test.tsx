import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

type ClickEvent = { latlng: { lat: number; lng: number } };
let capturedHandlers: { click?: (e: ClickEvent) => void } = {};

vi.mock('react-leaflet', () => ({
    useMapEvents: (handlers: { click?: (e: ClickEvent) => void }) => {
        capturedHandlers = handlers;
        return null;
    },
}));

const addStep = vi.fn();
const addSegment = vi.fn();
const renameStep = vi.fn();
let mockItinerary: { segments: Array<{ id: string; isStartEnd: boolean }> };

vi.mock('../../customObject/Itinerary/ItineraryStore', () => ({
    itineraryModel: {
        store: {},
        addStep: (...args: unknown[]) => addStep(...args),
        addSegment: (...args: unknown[]) => addSegment(...args),
        renameStep: (...args: unknown[]) => renameStep(...args),
    },
}));

vi.mock('../../customObject/Itinerary/UseItinerary', () => ({
    useItinerary: () => mockItinerary,
}));

const reverseGeocode = vi.fn();
vi.mock('../../customObject/Search/geocode', () => ({
    reverseGeocode: (...args: unknown[]) => reverseGeocode(...args),
}));

import MapClickHandler from './MapClickHandler';

describe('MapClickHandler', () => {
    beforeEach(() => {
        capturedHandlers = {};
        addStep.mockClear();
        addSegment.mockClear();
        renameStep.mockClear();
        reverseGeocode.mockReset();
    });

    it("ajoute une étape avec les coordonnées puis l'adresse géocodée", async () => {
        mockItinerary = { segments: [{ id: 'seg-1', isStartEnd: false }] };
        reverseGeocode.mockResolvedValue('12 Rue de la Paix, Paris');
        render(<MapClickHandler />);

        capturedHandlers.click!({ latlng: { lat: 48.86, lng: 2.33 } });

        expect(addStep).toHaveBeenCalledWith(
            'seg-1',
            expect.objectContaining({
                content: expect.objectContaining({
                    title: '48.860000 2.330000',
                    location: { lat: 48.86, lon: 2.33 },
                }),
            })
        );
        await waitFor(() =>
            expect(renameStep).toHaveBeenCalledWith('seg-1', expect.any(String), '12 Rue de la Paix, Paris')
        );
    });

    it('crée un segment quand aucun segment régulier', () => {
        mockItinerary = { segments: [] };
        reverseGeocode.mockResolvedValue(null);
        render(<MapClickHandler />);

        capturedHandlers.click!({ latlng: { lat: 1, lng: 2 } });

        expect(addSegment).toHaveBeenCalled();
        expect(addStep).toHaveBeenCalled();
    });

    it('conserve les coordonnées quand le géocodage échoue', async () => {
        mockItinerary = { segments: [{ id: 'seg-1', isStartEnd: false }] };
        reverseGeocode.mockResolvedValue(null);
        render(<MapClickHandler />);

        capturedHandlers.click!({ latlng: { lat: 48.86, lng: 2.33 } });

        await waitFor(() => expect(reverseGeocode).toHaveBeenCalled());
        expect(renameStep).not.toHaveBeenCalled();
    });

    it('ignore une erreur réseau du géocodage sans planter', async () => {
        mockItinerary = { segments: [{ id: 'seg-1', isStartEnd: false }] };
        reverseGeocode.mockRejectedValue(new Error('network'));
        render(<MapClickHandler />);

        capturedHandlers.click!({ latlng: { lat: 48.86, lng: 2.33 } });

        await waitFor(() => expect(reverseGeocode).toHaveBeenCalled());
        expect(renameStep).not.toHaveBeenCalled();
    });
});
