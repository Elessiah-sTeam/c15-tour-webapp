import { useState, useEffect, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import { RoutePolyline } from './RoutePolyline';
import type { Coordinates } from './osrm';
import './InteractiveRouteBuilder.css';


interface InteractiveRouteBuilderProps {
    /** Fonction appelée quand l'itinéraire change */
    onRouteChange?: (waypoints: Coordinates[]) => void;
    /** Points initiaux (optionnel) */
    initialWaypoints?: Coordinates[];
}

/**
 * Composant qui permet de créer un itinéraire en cliquant sur la carte
 *
 * COMMENT ÇA MARCHE :
 * 1. L'utilisateur clique sur la carte
 * 2. On ajoute le point dans le state `waypoints`
 * 3. RoutePolyline recalcule automatiquement la route
 * 4. Les marqueurs A, B, C... s'affichent
 */
export function InteractiveRouteBuilder({
                                            onRouteChange,
                                            initialWaypoints = []
                                        }: InteractiveRouteBuilderProps) {

    // ── État : liste des points cliqués ──
    const [waypoints, setWaypoints] = useState<Coordinates[]>(initialWaypoints);

    // ── État : distance totale calculée par OSRM ─────────────────────
    const [totalDistance, setTotalDistance] = useState<number>(0);

    // ── État : durée totale calculée par OSRM ────────────────────────
    const [totalDuration, setTotalDuration] = useState<number>(0);

    const map = useMapEvents({
        click(e) {
            // e.latlng contient les coordonnées du clic [lat, lng]
            const { lat, lng } = e.latlng;

            // Ajouter le nouveau point [lng, lat] (format OSRM)
            const newPoint: Coordinates = [lng, lat];
            setWaypoints([...waypoints, newPoint]);

            console.log(`✅ Point ajouté : ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
    });

    // ── Appeler le callback quand les waypoints changent ─────────────
    useEffect(() => {
        if (onRouteChange) {
            onRouteChange(waypoints);
        }
    }, [waypoints, onRouteChange]);

    // ── Handlers pour les boutons ──

    /** Supprimer le dernier point ajouté */
    const handleRemoveLast = () => {
        if (waypoints.length === 0) return;
        setWaypoints(waypoints.slice(0, -1)); // Enlève le dernier élément
        console.log('🗑️ Dernier point supprimé');
    };

    /** Effacer tous les points */
    const handleClearAll = () => {
        setWaypoints([]);
        setTotalDistance(0);
        setTotalDuration(0);
        console.log(' Tous les points effacés');
    };
// ── Callback quand OSRM a calculé la route ───────────────────────
    const handleRouteCalculated = useCallback(({
                                                   totalDistance,
                                                   totalDuration
                                               }: {
        totalDistance: number;
        totalDuration: number;
    }) => {
        setTotalDistance(totalDistance);
        setTotalDuration(totalDuration);
    }, []);

    // ── Formater la durée en heures/minutes ──────────────────────────
    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    };

    return (
        <>
            {/* PANNEAU DE CONTRÔLE (en haut à droite)                       */}
            <div className="route-builder-panel">
                <div className="panel-header">
                    <h3>📍Créer un itinéraire </h3>
                    <p className="panel-hint">Cliquez sur la carte pour ajouter des points</p>
                </div>

                {/* ─── Infos sur l'itinéraire ─── */}
                <div className="route-info">
                    <div className="info-item">
                        <span className="info-label">Points :</span>
                        <span className="info-value">{waypoints.length}</span>
                    </div>

                    {waypoints.length >= 2 && (
                        <>
                            <div className="info-item">
                                <span className="info-label">Distance :</span>
                                <span className="info-value">
                  {(totalDistance / 1000).toFixed(1)} km
                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Durée :</span>
                                <span className="info-value">
                  {formatDuration(totalDuration)}
                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* ─── Boutons d'action ─── */}
                <div className="panel-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleRemoveLast}
                        disabled={waypoints.length === 0}
                        title="Supprimer le dernier point (ou Ctrl+Z)"
                    >
                        ↶ Annuler
                    </button>

                    <button
                        className="btn btn-danger"
                        onClick={handleClearAll}
                        disabled={waypoints.length === 0}
                        title="Effacer tous les points"
                    >
                        🗑️ Tout effacer
                    </button>
                </div>

                {/* ─── Liste des points ─── */}
                {waypoints.length > 0 && (
                    <div className="waypoints-list">
                        <h4>Points de passage :</h4>
                        <ul>
                            {waypoints.map((point, index) => {
                                const [lng, lat] = point;
                                const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
                                return (
                                    <li key={index}>
                                        <span className="waypoint-label">{labels[index] || index + 1}</span>
                                        <span className="waypoint-coords">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {waypoints.length >= 2 && (
                <RoutePolyline
                    map={map}
                    waypoints={waypoints}
                    onRouteLoaded={handleRouteCalculated}
                />
            )}
        </>
    );
}