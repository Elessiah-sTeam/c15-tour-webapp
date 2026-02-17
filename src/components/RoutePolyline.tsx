import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import type {Coordinates} from './osrm';

interface RoutePolylineProps {
    map: L.Map;
    waypoints: Coordinates[];
    color?: string;
    showMarkers?: boolean;
    onRouteLoaded?: (info: {
        totalDistance: number;
        totalDuration: number;
    }) => void;
}

export function RoutePolyline({
                                  map,
                                  waypoints,
                                  color = '#bb487c',
                                  showMarkers = true,
                                  onRouteLoaded
                              }: RoutePolylineProps) {

    const [, setIsLoading] = useState(false);
    const [, setError] = useState<string | null>(null);

    const polylineRef = useRef<L.Polyline | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {

        // Supprimer l'ancienne polyline
        if (polylineRef.current) {
            map.removeLayer(polylineRef.current);
            polylineRef.current = null;
        }

        // Supprimer les anciens marqueurs
        markersRef.current.forEach(marker => {
            map.removeLayer(marker);
        });
        markersRef.current = [];

        // Si moins de 2 points → on arrête ici (tout est déjà nettoyé)
        if (waypoints.length < 2) {
            return;
        }

        // Dessiner la nouvelle route
        const drawRoute = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // ─── 1. Appeler OSRM ────
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';')}?geometries=geojson&overview=full`
                );

                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data = await response.json();

                if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                    throw new Error("Aucune route trouvée");
                }

                const route = data.routes[0];
                const routeCoords = route.geometry.coordinates;

                // ─── 2. Callback avec distance/durée ──────────────────────
                const totalDistance = route.distance;
                const totalDuration = route.duration;

                if (onRouteLoaded) {
                    onRouteLoaded({ totalDistance, totalDuration });
                }

                // ─── 3. Dessiner la ligne  ────
                const latLngs = routeCoords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);

                const polyline = L.polyline(latLngs, {
                    color: color,
                    weight: 5,
                    opacity: 0.8,
                }).addTo(map);

                polylineRef.current = polyline;

                // ─── 4. Ajouter les marqueurs A, B, C... ───
                if (showMarkers) {
                    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

                    waypoints.forEach(([lng, lat], index) => {
                        const icon = L.divIcon({
                            html: `
                <div style="
                  background: #bb487c;
                  color: white;
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 18px;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                ">
                  ${labels[index] || index + 1}
                </div>
              `,
                            className: '',
                            iconSize: [40, 40],
                            iconAnchor: [20, 20],
                        });

                        const marker = L.marker([lat, lng], { icon }).addTo(map);
                        markersRef.current.push(marker);
                    });
                }

                // ─── 5. Zoomer sur la route ───
                map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Erreur inconnue';
                setError(message);
                console.error(' Erreur lors du tracé de la route:', err);
            } finally {
                setIsLoading(false);
            }
        };

        drawRoute();

        // Cleanup final quand le composant se démonte
        return () => {
            if (polylineRef.current) {
                map.removeLayer(polylineRef.current);
            }
            markersRef.current.forEach(marker => map.removeLayer(marker));
        };

    }, [map, waypoints, color, showMarkers, onRouteLoaded]);

    return null;
}