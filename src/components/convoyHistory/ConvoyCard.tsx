import type {Convoy} from './convoyTypes';
import './ConvoyCard.css';

interface ConvoyCardProps {
    convoy: Convoy;
    onOpen: (convoy: Convoy) => void;
    onShare: (convoy: Convoy) => void;
    onExport: (convoy: Convoy) => void;
}

export function ConvoyCard({ convoy, onOpen, onShare, onExport }: ConvoyCardProps) {

    // ── Formater la durée ──────────────────────────────────────────────
    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${mins.toString().padStart(2, '0')}`;
    };

    // ── Formater la date ───────────────────────────────────────────────
    const formatDate = (date: Date): string => {
        return `Créé le ${date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })}`;
    };

    // ── Badge de statut ────────────────────────────────────────────────
    const getStatusBadge = () => {
        switch (convoy.status) {
            case 'draft':
                return <span className="status-badge status-draft">Brouillon</span>;
            case 'finalized':
                return <span className="status-badge status-finalized">Finalisé</span>;
            case 'archived':
                return <span className="status-badge status-archived">Archivé</span>;
        }
    };

    // ── Calculer le temps estimé (durée + pauses) ──────────────────────
    const estimatedTime = formatDuration(convoy.totalDuration + (convoy.points.length - 2) * 15);

    return (
        <div className="convoy-card">
            {/* Miniature de la carte */}
            <div className="convoy-thumbnail">
                {convoy.thumbnail ? (
                    <img src={convoy.thumbnail} alt={`Carte ${convoy.name}`} />
                ) : (
                    <div className="convoy-thumbnail-placeholder">
                        {convoy.points.slice(0, 4).map((_, index) => (
                            <div
                                key={index}
                                className="mini-marker"
                                style={{
                                    left: `${20 + index * 20}%`,
                                    top: `${30 + (index % 2) * 20}%`
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Informations du convoi */}
            <div className="convoy-info">
                <div className="convoy-header">
                    <h3 className="convoy-title">{convoy.name}</h3>
                    {getStatusBadge()}
                </div>

                <div className="convoy-route">
                    {convoy.startCity} → {convoy.endCity}
                </div>

                <div className="convoy-details">
          <span className="detail-item">
            <span className="detail-icon">📍</span>
              {convoy.points.length} points
          </span>
                    <span className="detail-separator">•</span>
                    <span className="detail-item">
            <span className="detail-icon">🛣️</span>
                        {convoy.totalDistance} km
          </span>
                    <span className="detail-separator">•</span>
                    <span className="detail-item">
            <span className="detail-icon">⏱️</span>
                        {formatDuration(convoy.totalDuration)}
          </span>
                    <span className="detail-separator">•</span>
                    <span className="detail-item">
            <span className="detail-icon">⏰</span>
                        {estimatedTime}
          </span>
                </div>

                <div className="convoy-date">
                    {formatDate(convoy.createdAt)}
                </div>
            </div>

            {/* Actions */}
            <div className="convoy-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => onOpen(convoy)}
                >
                    Ouvrir
                    <span className="btn-icon">›</span>
                </button>

                <button
                    className="btn btn-icon-only"
                    onClick={() => onShare(convoy)}
                    title="Partager"
                >
                    <span className="icon-share">🔗</span>
                </button>

                <button
                    className="btn btn-icon-only"
                    onClick={() => onExport(convoy)}
                    title="Exporter"
                >
                    <span className="icon-export">↓</span>
                </button>

                <button className="btn btn-icon-only" title="Plus d'options">
                    <span className="icon-more">⋯</span>
                </button>
            </div>
        </div>
    );
}