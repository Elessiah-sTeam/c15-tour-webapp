import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

type ClickEvent = { latlng: { lat: number; lng: number } };
let capturedHandlers: { click?: (e: ClickEvent) => void } = {};

vi.mock('react-leaflet', () => ({
    useMapEvents: (handlers: { click?: (e: ClickEvent) => void }) => {
        capturedHandlers = handlers;
        return null;
    },
}));

const addStepFromClick = vi.fn();
vi.mock('./mapClickUtils', () => ({
    addStepFromClick: (...args: unknown[]) => addStepFromClick(...args),
}));

import MapClickHandler from './MapClickHandler';

describe('MapClickHandler', () => {
    beforeEach(() => {
        capturedHandlers = {};
        addStepFromClick.mockReset();
    });

    it('délègue le clic carte à addStepFromClick avec les coordonnées', () => {
        render(<MapClickHandler />);

        capturedHandlers.click!({ latlng: { lat: 48.86, lng: 2.33 } });

        expect(addStepFromClick).toHaveBeenCalledWith(48.86, 2.33);
    });
});
