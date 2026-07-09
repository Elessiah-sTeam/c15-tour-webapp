import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import type { Segment } from '../../../customObject/Itinerary/types';
import { TimeSpan } from '../../../customObject/TimeSpan';

vi.mock('./SortableStepHeader', () => ({
    default: ({ durationHint }: { durationHint?: string | null }) => (
        <div data-testid="header" data-hint={durationHint ?? ''} />
    ),
}));
vi.mock('./SortablePDP', () => ({ default: () => <div /> }));
vi.mock('./EmptyDropZone', () => ({ EmptyDropZone: () => <div /> }));
vi.mock('../../../customObject/Itinerary/ItineraryStore', () => ({
    itineraryModel: {},
}));

import SortableCategory from './SortableCategory';

function segment(id: string): Segment {
    return {
        id,
        isStartEnd: false,
        content: { title: id, hour: new Date(), duration: new TimeSpan(), distance: 0 },
        steps: [],
    };
}

function renderCategory(durationHint: string | null) {
    return render(
        <DndContext>
            <SortableCategory category={segment('seg-1')} visible={true} idActiveItem={null} durationHint={durationHint} />
        </DndContext>
    );
}

describe('SortableCategory surbrillance durée', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('transmet le hint au header pour la surbrillance', () => {
        renderCategory('Segment trop long');

        expect(screen.getByTestId('header')).toHaveAttribute('data-hint', 'Segment trop long');
    });

    it("n'affiche pas de message au montage même si le segment est déjà hors bornes", () => {
        renderCategory('Segment trop long');

        expect(screen.queryByText('Segment trop long')).not.toBeInTheDocument();
    });

    it('affiche un message transitoire quand le segment devient hors bornes, puis le masque', () => {
        const message = 'Segment trop court : 0h30 (min 1h)';
        const { rerender } = renderCategory(null);

        act(() => {
            rerender(
                <DndContext>
                    <SortableCategory category={segment('seg-1')} visible={true} idActiveItem={null} durationHint={message} />
                </DndContext>
            );
        });

        expect(screen.getByText(message)).toBeInTheDocument();

        act(() => vi.advanceTimersByTime(4000));

        expect(screen.queryByText(message)).not.toBeInTheDocument();
    });
});
