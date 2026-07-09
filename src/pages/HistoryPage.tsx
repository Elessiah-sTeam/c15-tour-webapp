import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { House, LogOut, Search, Inbox } from 'lucide-react';
import { ItineraryCard } from '../components/History/ItineraryCard';
import ShareModal from '../components/Panels/ShareModal';
import type { ItineraryResponse } from '../customObject/Itinerary/netTypes';
import { itineraryModel } from '../customObject/Itinerary/ItineraryStore';
import { itineraryResponseToItinerary } from '../customObject/Itinerary/itineraryResponseMapper';
import { downloadItineraryPdf } from '../customObject/Itinerary/pdf';
import { getAuthToken, useAuth } from '../auth/useAuth';
import { pushErrorToast } from '../customObject/Toast/ToastStore';
import '../components/History/HistoryPage.css';
import { BACKEND_URL } from '../config';

function authHeaders(): HeadersInit {
    const token = getAuthToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

const PAGE_SIZE = 20;

export default function HistoryPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [itineraries, setItineraries] = useState<ItineraryResponse[]>([]);
    const [filtered, setFiltered] = useState<ItineraryResponse[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'draft' | 'finalized' | 'recent'>('all');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [clientPage, setClientPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [shareTarget, setShareTarget] = useState<{ code: string; label: string } | null>(null);
    const [exportingId, setExportingId] = useState<number | null>(null);

    const isFiltered = filter !== 'all';

    const loadItineraries = useCallback(async () => {
        const filterActive = filter !== 'all';
        try {
            setLoading(true);
            if (!filterActive) {
                const res = await fetch(`${BACKEND_URL}/tours?page=${page}&size=${PAGE_SIZE}`, { headers: authHeaders() });
                if (!res.ok) throw new Error('Backend error');
                const data = await res.json();
                setItineraries(data.content);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            } else {
                // Fetch first page to know total page count
                const firstRes = await fetch(`${BACKEND_URL}/tours?page=0&size=${PAGE_SIZE}`, { headers: authHeaders() });
                if (!firstRes.ok) throw new Error('Backend error');
                const firstData = await firstRes.json();
                setTotalPages(firstData.totalPages);
                setTotalElements(firstData.totalElements);

                if (firstData.totalPages <= 1) {
                    setItineraries(firstData.content);
                } else {
                    // Fetch all remaining pages in parallel
                    const pagePromises: Promise<ItineraryResponse[]>[] = [];
                    for (let p = 1; p < firstData.totalPages; p++) {
                        pagePromises.push(
                            fetch(`${BACKEND_URL}/tours?page=${p}&size=${PAGE_SIZE}`, { headers: authHeaders() })
                                .then(r => r.json())
                                .then((d: { content: ItineraryResponse[] }) => d.content)
                        );
                    }
                    const remainingPages = await Promise.all(pagePromises);
                    setItineraries([...firstData.content, ...remainingPages.flat()]);
                }
            }
        } catch {
            pushErrorToast('Erreur chargement des convois');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    const applyFilters = useCallback(() => {
        let result = [...itineraries];

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i => i.name.toLowerCase().includes(q));
        }

        if (filter === 'draft') {
            result = result.filter(i => i.draft !== false);
        } else if (filter === 'finalized') {
            result = result.filter(i => i.draft === false);
        }

        setFiltered(result);
    }, [search, filter, itineraries]);

    useEffect(() => {
        loadItineraries();
    }, [loadItineraries]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    useEffect(() => {
        setClientPage(0);
    }, [filter, search]);

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ce convoi ?')) return;
        try {
            await fetch(`${BACKEND_URL}/tours/${id}`, { method: 'DELETE', headers: authHeaders() });
            setItineraries(prev => prev.filter(i => i.id !== id));
        } catch {
            pushErrorToast('Erreur lors de la suppression du convoi');
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const handleCreateNew = () => {
        itineraryModel.reset();
        navigate('/planner');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleOpenConvoy = async (id: number) => {
        await itineraryModel.netModel.get(id);
        navigate('/planner?id=' + id);
    };

    const handleExportPdf = async (id: number) => {
        try {
            setExportingId(id);
            const res = await fetch(`${BACKEND_URL}/tours/${id}`, { headers: authHeaders() });
            if (!res.ok) {
                throw new Error('Backend error');
            }

            const itinerary = itineraryResponseToItinerary(await res.json() as ItineraryResponse);
            await downloadItineraryPdf(itinerary);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            pushErrorToast(`Erreur lors de l'export PDF : ${detail}`);
        } finally {
            setExportingId((current) => (current === id ? null : current));
        }
    };

    const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const effectivePage = isFiltered ? clientPage : page;
    const effectiveTotalPages = isFiltered ? filteredTotalPages : totalPages;
    const effectiveTotalElements = isFiltered ? filtered.length : totalElements;
    const displayedItems = isFiltered
        ? filtered.slice(clientPage * PAGE_SIZE, (clientPage + 1) * PAGE_SIZE)
        : filtered;

    const handlePrevPage = () => {
        if (isFiltered) setClientPage(p => p - 1);
        else setPage(p => p - 1);
    };

    const handleNextPage = () => {
        if (isFiltered) setClientPage(p => p + 1);
        else setPage(p => p + 1);
    };

    const showPagination = !loading && (isFiltered ? filtered.length > 0 : totalPages > 1);

    return (
        <>
        <div className="convoy-history-page">
            <div className="map-background" />

            <header className="ch-header">
                <div className="ch-brand">
                    <h1 className="ch-brand-title">C15 FIESTA TOUR</h1>
                </div>
                <div className="ch-header-actions">
                    <button className="ch-btn-home" onClick={handleGoHome}>
                        <House size={17} strokeWidth={2.3} />
                        Accueil
                    </button>
                    <button className="ch-btn-new" onClick={handleCreateNew}>
                        <span className="ch-plus">+</span>
                        Nouveau convoi
                        <span className="ch-arrow">›</span>
                    </button>
                    <button className="ch-btn-logout" onClick={handleLogout} aria-label="Se déconnecter">
                        <LogOut size={18} strokeWidth={2.4} />
                    </button>
                </div>
            </header>

            <main className="ch-content">
                <h2 className="ch-page-title">Historique des convois</h2>

                <div className="ch-search">
                    <Search size={16} className="ch-search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher un convoi (nom / ville)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="ch-search-input"
                    />
                    {search && (
                        <button className="ch-search-clear" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>

                <div className="ch-filters">
                    <button
                        className={`ch-filter ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tous
                    </button>
                    <button
                        className={`ch-filter ${filter === 'draft' ? 'active' : ''}`}
                        onClick={() => setFilter('draft')}
                    >
                        Brouillons
                    </button>
                    <button
                        className={`ch-filter ${filter === 'finalized' ? 'active' : ''}`}
                        onClick={() => setFilter('finalized')}
                    >
                        Finalisés
                    </button>
                </div>

                {loading ? (
                    <div className="ch-empty">Chargement...</div>
                ) : displayedItems.length === 0 ? (
                    <div className="ch-empty"><Inbox size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />Aucun convoi trouvé</div>
                ) : (
                    <div className="ch-list">
                        {displayedItems.map(itinerary => (
                            <ItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                onOpen={handleOpenConvoy}
                                onDelete={handleDelete}
                                onShare={(code, label) => setShareTarget({ code, label })}
                                onExportPdf={handleExportPdf}
                                isExportingPdf={exportingId === itinerary.id}
                            />
                        ))}
                    </div>
                )}

                {showPagination && (
                    <div className="ch-pagination">
                        <button
                            className="ch-page-btn"
                            onClick={handlePrevPage}
                            disabled={effectivePage === 0}
                        >
                            ‹
                        </button>
                        <span className="ch-page-info">
                            {effectivePage + 1} / {effectiveTotalPages}
                            <span className="ch-page-total"> ({effectiveTotalElements} convoi{effectiveTotalElements !== 1 ? 's' : ''})</span>
                        </span>
                        <button
                            className="ch-page-btn"
                            onClick={handleNextPage}
                            disabled={effectivePage >= effectiveTotalPages - 1}
                        >
                            ›
                        </button>
                    </div>
                )}
            </main>
        </div>

        {shareTarget && (
            <ShareModal
                shareCode={shareTarget.code}
                codeLabel={shareTarget.label}
                onClose={() => setShareTarget(null)}
            />
        )}
        </>
    );
}
