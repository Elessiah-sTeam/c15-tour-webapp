import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Itinerary, Segment } from '../../../customObject/Itinerary/types';
import { TimeSpan } from '../../../customObject/TimeSpan';

vi.mock('./SortableCategory', () => ({
    default: ({ category }: { category: Segment }) => <div data-testid={`cat-${category.id}`} />,
}));

vi.mock('./UseDragNDrop', () => ({
    useDragNDrop: () => ({
        handleDragStart: vi.fn(),
        handleDragEnd: vi.fn(),
        activeItem: null,
        activeCat: null,
    }),
}));

let mockItinerary: Itinerary;
vi.mock('../../../customObject/Itinerary/UseItinerary', () => ({
    useItinerary: () => mockItinerary,
}));

import StepList from './StepList';

function segment(id: string, breakDuration: number, isStartEnd = false): Segment {
    return {
        id,
        isStartEnd,
        content: { title: id, hour: new Date(), duration: new TimeSpan(), distance: 0, breakDuration },
        steps: [],
    };
}

function itineraryWith(segments: Segment[]): Itinerary {
    return {
        id: 1,
        name: 'C15',
        shareCode: '',
        totalDuration: new TimeSpan(),
        totalDistance: 0,
        segments,
        draft: true,
    };
}

describe('StepList pause lines', () => {
    it('affiche une ligne pause pour chaque segment avec une pause', () => {
        mockItinerary = itineraryWith([segment('seg-1', 30 * 60), segment('seg-2', 0)]);
        const { rerender } = render(<StepList />);
        rerender(<StepList />);

        expect(screen.getAllByText('Pause')).toHaveLength(1);
        expect(screen.getByText('0H 30MIN')).toBeInTheDocument();
    });

    it('ignore la pause des segments de début/fin', () => {
        mockItinerary = itineraryWith([segment('end', 30 * 60, true)]);
        render(<StepList />);

        expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    });
});
