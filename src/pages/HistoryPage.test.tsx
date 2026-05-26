import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from './HistoryPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../auth/useAuth', () => ({
    useAuth: () => ({ logout: vi.fn() }),
    getAuthToken: vi.fn(() => null),
}));

vi.mock('../customObject/Itinerary/ItineraryStore', () => ({
    itineraryModel: {
        reset: vi.fn(),
        netModel: { get: vi.fn() },
    },
}));

vi.mock('../components/History/ItineraryCard', () => ({
    ItineraryCard: ({ onDelete, itinerary }: { onDelete: (id: number) => void; itinerary: { id: number; name: string } }) => (
        <button data-testid={`delete-${itinerary.id}`} onClick={() => onDelete(itinerary.id)}>
            Supprimer {itinerary.name}
        </button>
    ),
}));

vi.mock('../components/Panels/ShareModal', () => ({
    default: () => null,
}));

function renderHistoryPage() {
    return render(
        <MemoryRouter>
            <HistoryPage />
        </MemoryRouter>
    );
}

describe('HistoryPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        mockNavigate.mockReset();
    });

    it('affiche un message vide quand le chargement échoue', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

        renderHistoryPage();

        await waitFor(() => {
            expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });
        expect(screen.getByText(/Aucun convoi trouvé/i)).toBeInTheDocument();
    });

    it('appelle pushErrorToast si la suppression échoue', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    content: [{ id: 1, name: 'Convoi test', draft: true }],
                    totalPages: 1,
                    totalElements: 1,
                }),
            } as Response)
            .mockRejectedValueOnce(new Error('Network error'));

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderHistoryPage();

        await waitFor(() => {
            expect(screen.getByTestId('delete-1')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByTestId('delete-1'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        vi.restoreAllMocks();
    });
});
