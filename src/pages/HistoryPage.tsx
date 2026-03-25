import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ItineraryCard } from '../components/History/ItineraryCard';
import type { ItineraryResponse } from '../customObject/Itinerary/netTypes';
import { itineraryModel } from '../customObject/Itinerary/ItineraryStore';
import { getAuthToken, useAuth } from '../auth/AuthContext';
import '../components/History/HistoryPage.css';

const BACKEND_URL = "http://localhost:8080";

function authHeaders(): HeadersInit {
    const token = getAuthToken();
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [itineraries, setItineraries] = useState<ItineraryResponse[]>([]);
    const [filtered, setFiltered] = useState<ItineraryResponse[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'draft' | 'finalized' | 'recent'>('all');
    const [loading, setLoading] = useState(true);

    const loadItineraries = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/tours`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Backend error');
            const data: ItineraryResponse[] = await res.json();
            setItineraries(data);
        } catch (err) {
            console.error('Erreur chargement:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const applyFilters = useCallback(() => {
        let result = [...itineraries];

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i => i.name.toLowerCase().includes(q));
        }

        if (filter === 'draft') {
            result = result.filter(i => i.segments.every(s => s.waypoints.length < 2));
        } else if (filter === 'finalized') {
            result = result.filter(i => i.segments.every(s => s.waypoints.length >= 2));
        }

        setFiltered(result);
    }, [search, filter, itineraries]);

    useEffect(() => {
        loadItineraries();
    }, [loadItineraries]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ce convoi ?')) return;
        try {
            await fetch(`${BACKEND_URL}/tours/${id}`, { method: 'DELETE', headers: authHeaders() });
            setItineraries(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Erreur suppression:', err);
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

    const handleOpenConvoy = async (id: number) => {
        await itineraryModel.netModel.get(id);
        navigate('/planner?id=' + id);
    };

    return (
        <div className="convoy-history-page">
            <div className="map-background" />

            <header className="ch-header">
                <div className="ch-brand">
                    <span className="ch-logo">🚗</span>
                    <h1 className="ch-brand-title">C15 FIESTA TOUR</h1>
                </div>
                <div className="ch-header-actions">
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
                    <span className="ch-search-icon">🔍</span>
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
                ) : filtered.length === 0 ? (
                    <div className="ch-empty">📭 Aucun convoi trouvé</div>
                ) : (
                    <div className="ch-list">
                        {filtered.map(itinerary => (
                            <ItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                onOpen={handleOpenConvoy}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}