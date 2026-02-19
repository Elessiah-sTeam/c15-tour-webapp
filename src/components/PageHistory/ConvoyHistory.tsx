import { useState, useEffect } from 'react';
import { ConvoyThumbnail } from './ConvoyThumbnail';
import type { ItineraryResponse, SegmentResponse } from '../../customObject/Itinerary/netTypes';
import './ConvoyHistory.css';

const BACKEND_URL = "http://localhost:8080";

function getStatus(it: ItineraryResponse): 'draft' | 'finalized' {
    return it.segments.every(s => s.waypoints.length >= 2) ? 'finalized' : 'draft';
}

function formatDuration(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

function formatDistance(m: number): string {
    return `${(m * 0.001).toFixed(0)} km`;
}

function countPoints(segs: SegmentResponse[]): number {
    return segs.reduce((sum, s) => sum + s.waypoints.length, 0);
}

function getStartCity(segs: SegmentResponse[]): string {
    return segs[0]?.waypoints[0]?.name || 'Départ';
}

function getEndCity(segs: SegmentResponse[]): string {
    const last = segs[segs.length - 1];
    return last?.waypoints[last.waypoints.length - 1]?.name || 'Arrivée';
}

interface ConvoyHistoryProps {
    onCreateNew: () => void;
    onOpenConvoy: (id: number) => void;
}

export function ConvoyHistory({ onCreateNew, onOpenConvoy }: ConvoyHistoryProps) {
    const [its, setIts] = useState<ItineraryResponse[]>([]);
    const [filtered, setFiltered] = useState<ItineraryResponse[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'draft' | 'finalized' | 'recent'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);
    useEffect(() => { applyFilters(); }, [search, filter, its]);

    const load = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/tours`);
            if (!res.ok) throw new Error('Backend error');
            const data: ItineraryResponse[] = await res.json();
            setIts(data);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...its];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.name.toLowerCase().includes(q) ||
                getStartCity(i.segments).toLowerCase().includes(q) ||
                getEndCity(i.segments).toLowerCase().includes(q)
            );
        }
        if (filter === 'draft') result = result.filter(i => getStatus(i) === 'draft');
        else if (filter === 'finalized') result = result.filter(i => getStatus(i) === 'finalized');
        else if (filter === 'recent') {
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            result = result.filter(i => new Date(i.id).getTime() > sevenDaysAgo);
        }
        setFiltered(result);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ?')) return;
        try {
            await fetch(`${BACKEND_URL}/tours/${id}`, { method: 'DELETE' });
            setIts(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    return (
        <div className="convoy-history-page">
            <div className="map-background" />
            <header className="ch-header">
                <div className="ch-brand">
                    <span className="ch-logo">🚗</span>
                    <h1 className="ch-brand-title">C15 FIESTA TOUR</h1>
                </div>
                <button className="ch-btn-new" onClick={onCreateNew}>
                    <span className="ch-plus">+</span>
                    Nouveau convoi
                    <span className="ch-arrow">›</span>
                </button>
            </header>
            <main className="ch-content">
                <h2 className="ch-page-title">Historique des convois</h2>
                <div className="ch-search">
                    <span className="ch-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Rechercher un convoi (nom / ville / date)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="ch-search-input"
                    />
                    {search && <button className="ch-search-clear" onClick={() => setSearch('')}>✕</button>}
                </div>
                <div className="ch-filters">
                    <button className={`ch-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous</button>
                    <button className={`ch-filter ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>Brouillons</button>
                    <button className={`ch-filter ${filter === 'finalized' ? 'active' : ''}`} onClick={() => setFilter('finalized')}>Finalisés</button>
                    <button className={`ch-filter ${filter === 'recent' ? 'active' : ''}`} onClick={() => setFilter('recent')}>Récents (7 jours)</button>
                </div>
                {loading ? (
                    <div className="ch-empty">Chargement...</div>
                ) : filtered.length === 0 ? (
                    <div className="ch-empty">📭 Aucun convoi trouvé</div>
                ) : (
                    <div className="ch-list">
                        {filtered.map(it => {
                            const status = getStatus(it);
                            return (
                                <div key={it.id} className="ch-card">
                                    <div className="ch-thumb">
                                        <ConvoyThumbnail segments={it.segments} />
                                    </div>
                                    <div className="ch-info">
                                        <div className="ch-title-row">
                                            <h3 className="ch-title">{it.name}</h3>
                                            <span className={`ch-badge ${status}`}>
                                                {status === 'draft' ? 'Brouillon' : 'Finalisé'}
                                            </span>
                                        </div>
                                        <div className="ch-route">
                                            {getStartCity(it.segments)} → {getEndCity(it.segments)}
                                        </div>
                                        <div className="ch-stats">
                                            <span>{countPoints(it.segments)} points</span>
                                            <span className="ch-dot">•</span>
                                            <span>{formatDistance(it.totalDistance)}</span>
                                            <span className="ch-dot">•</span>
                                            <span>{formatDuration(it.totalDuration)}</span>
                                        </div>
                                        <div className="ch-date">Créé le {new Date(it.id).toLocaleDateString('fr-FR')}</div>
                                    </div>
                                    <div className="ch-actions">
                                        <button className="ch-btn-open" onClick={() => onOpenConvoy(it.id)}>Ouvrir ›</button>
                                        <button className="ch-btn-icon" title="Partager">🔗</button>
                                        <button className="ch-btn-icon" title="Exporter">⬇️</button>
                                        <button className="ch-btn-icon" onClick={() => handleDelete(it.id)}>⋯</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}