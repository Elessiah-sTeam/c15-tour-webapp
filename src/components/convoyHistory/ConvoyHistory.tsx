import { useState, useMemo } from 'react';
import type {Convoy, ConvoyFilters} from './convoyTypes';
import { ConvoyCard } from './ConvoyCard';
import './ConvoyHistory.css';

interface ConvoyHistoryProps {
    convoys: Convoy[];
    onCreateNew: () => void;
    onBack?: () => void;
}

export function ConvoyHistory({ convoys, onCreateNew, onBack }: ConvoyHistoryProps) {

    const [filters, setFilters] = useState<ConvoyFilters>({
        searchQuery: '',
        status: 'all',
        recent: false
    });

    const filteredConvoys = useMemo(() => {
        let result = [...convoys];

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(convoy =>
                convoy.name.toLowerCase().includes(query) ||
                convoy.startCity.toLowerCase().includes(query) ||
                convoy.endCity.toLowerCase().includes(query)
            );
        }

        if (filters.status !== 'all') {
            result = result.filter(convoy => convoy.status === filters.status);
        }

        if (filters.recent) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result = result.filter(convoy => convoy.createdAt >= sevenDaysAgo);
        }

        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return result;
    }, [convoys, filters]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
    };

    const handleFilterChange = (status: ConvoyFilters['status'], recent: boolean = false) => {
        setFilters({ searchQuery: filters.searchQuery, status, recent });
    };

    const handleOpen = (convoy: Convoy) => {
        console.log('Ouvrir le convoi:', convoy.name);
        // TODO: Charger le convoi dans l'éditeur
    };

    const handleShare = (convoy: Convoy) => {
        console.log('Partager le convoi:', convoy.name);
        // TODO: Générer lien de partage
    };

    const handleExport = (convoy: Convoy) => {
        console.log('Exporter le convoi:', convoy.name);
        // TODO: Export GPX/PDF
    };

    return (
        <div className="convoy-history">
            {/* Header */}
            <header className="convoy-history-header">
                <div className="header-left">
                    {onBack && (
                        <button className="btn-back-small" onClick={onBack} title="Retour à l'éditeur">
                            ←
                        </button>
                    )}
                    <div className="brand">
                        <span className="brand-icon">🚗</span>
                        <h1 className="brand-title">C15 FIESTA TOUR</h1>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn-new-convoy" onClick={onCreateNew}>
                        <span className="btn-plus">+</span>
                        Nouveau convoi
                        <span className="btn-arrow">›</span>
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="convoy-history-content">
                <div className="page-header">
                    <h2 className="page-title">Historique des convois</h2>
                    <p className="page-subtitle">
                        {convoys.length === 0
                            ? 'Commencez par créer votre premier convoi'
                            : `${convoys.length} convoi${convoys.length > 1 ? 's' : ''} enregistré${convoys.length > 1 ? 's' : ''}`
                        }
                    </p>
                </div>

                {/* Afficher les filtres seulement s'il y a des convois */}
                {convoys.length > 0 && (
                    <>
                        {/* Barre de recherche */}
                        <div className="search-bar">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Rechercher un convoi (nom / ville / date)"
                                value={filters.searchQuery}
                                onChange={handleSearch}
                            />
                            {filters.searchQuery && (
                                <button
                                    className="search-clear"
                                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Filtres */}
                        <div className="filters">
                            <button
                                className={`filter-btn ${filters.status === 'all' && !filters.recent ? 'active' : ''}`}
                                onClick={() => handleFilterChange('all', false)}
                            >
                                Tous
                            </button>
                            <button
                                className={`filter-btn ${filters.status === 'draft' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('draft', false)}
                            >
                                Brouillons
                            </button>
                            <button
                                className={`filter-btn ${filters.status === 'finalized' ? 'active' : ''}`}
                                onClick={() => handleFilterChange('finalized', false)}
                            >
                                Finalisés
                            </button>
                            <button
                                className={`filter-btn ${filters.recent ? 'active' : ''}`}
                                onClick={() => handleFilterChange('all', true)}
                            >
                                Récents (7 jours)
                            </button>
                        </div>
                    </>
                )}

                {/* Liste des convois */}
                <div className="convoy-list">
                    {filteredConvoys.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-illustration">
                                <div className="empty-icon">🗺️</div>
                                <div className="empty-road"></div>
                            </div>
                            <h3 className="empty-title">
                                {convoys.length === 0
                                    ? 'Aucun convoi pour le moment'
                                    : 'Aucun convoi trouvé'
                                }
                            </h3>
                            <p className="empty-description">
                                {convoys.length === 0
                                    ? 'Créez votre premier itinéraire de convoi en cliquant sur le bouton ci-dessous'
                                    : 'Essayez de modifier vos critères de recherche'
                                }
                            </p>
                            {convoys.length === 0 && (
                                <button className="btn-create-first" onClick={onCreateNew}>
                                    <span className="btn-icon">✨</span>
                                    Créer mon premier convoi
                                    <span className="btn-arrow">→</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredConvoys.map(convoy => (
                            <ConvoyCard
                                key={convoy.id}
                                convoy={convoy}
                                onOpen={handleOpen}
                                onShare={handleShare}
                                onExport={handleExport}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}