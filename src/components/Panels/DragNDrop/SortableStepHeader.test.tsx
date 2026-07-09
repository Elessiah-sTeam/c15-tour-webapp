import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { Segment } from '../../../customObject/Itinerary/types';
import type ItineraryModel from '../../../customObject/Itinerary/ItineraryModel';
import { TimeSpan } from '../../../customObject/TimeSpan';

vi.mock('../Item.tsx', () => ({ default: () => <div data-testid="item" /> }));
vi.mock('../SubTitleWHour.tsx', () => ({ default: () => <div data-testid="subtitle" /> }));
vi.mock('../../../customObject/Itinerary/ItineraryModel.ts', () => ({ default: class {} }));

import SortableStepHeader from './SortableStepHeader';

const category: Segment = {
    id: 'seg-1',
    isStartEnd: false,
    content: { title: 'Segment 1', hour: new Date(), duration: new TimeSpan(), distance: 0 },
    steps: [],
};

const model = {} as unknown as ItineraryModel;

function renderHeader(durationHint: string | null) {
    return render(
        <DndContext>
            <SortableContext items={[category.id]}>
                <SortableStepHeader category={category} model={model} durationHint={durationHint} />
            </SortableContext>
        </DndContext>
    );
}

describe('SortableStepHeader', () => {
    it('marque le header en rouge et pose un tooltip quand la durée est hors bornes', () => {
        const { container } = renderHeader('Segment 1 trop long : 5h00 (max 4h)');

        const header = container.querySelector('.StepHeader');
        expect(header).toHaveClass('invalid');
        expect(header).toHaveAttribute('aria-invalid', 'true');
        expect(header).toHaveAttribute('title', 'Segment 1 trop long : 5h00 (max 4h)');
    });

    it('ne marque pas le header quand la durée est valide', () => {
        const { container } = renderHeader(null);

        const header = container.querySelector('.StepHeader');
        expect(header).not.toHaveClass('invalid');
        expect(header).not.toHaveAttribute('aria-invalid');
        expect(header).not.toHaveAttribute('title');
    });
});
