import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PauseLine from './PauseLine';

describe('PauseLine', () => {
    it('affiche le libellé Pause', () => {
        render(<PauseLine durationSeconds={30 * 60} />);
        expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('affiche la durée formatée de la pause', () => {
        render(<PauseLine durationSeconds={30 * 60} />);
        expect(screen.getByText('0H 30MIN')).toBeInTheDocument();
    });

    it('affiche une durée en heures et minutes', () => {
        render(<PauseLine durationSeconds={(60 + 45) * 60} />);
        expect(screen.getByText('1H 45MIN')).toBeInTheDocument();
    });
});
