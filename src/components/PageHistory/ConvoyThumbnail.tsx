import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SegmentResponse } from '../../customObject/Itinerary/netTypes';

interface ConvoyThumbnailProps {
    segments: SegmentResponse[];
}

export function ConvoyThumbnail({ segments }: ConvoyThumbnailProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || segments.length === 0) return;

        // Nettoyer la carte existante
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        // Extraire toutes les coordonnées
        const allCoords: [number, number][] = [];
        segments.forEach(seg => {
            seg.waypoints.forEach(wp => {
                allCoords.push([wp.coordinates.latitude, wp.coordinates.longitude]);
            });
        });

        if (allCoords.length === 0) return;

        const map = L.map(mapRef.current, {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            attributionControl: false
        });

        mapInstanceRef.current = map;

        // Tuiles OSM
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        // Dessiner les routes
        segments.forEach(seg => {
            if (seg.geometry) {
                try {
                    const geojson = JSON.parse(seg.geometry);
                    if (geojson.coordinates) {
                        // Inverser lat/lng pour Leaflet
                        const latlngs = geojson.coordinates.map((coord: number[]) =>
                            [coord[1], coord[0]] as [number, number]
                        );
                        L.polyline(latlngs, {
                            color: '#BB487C',
                            weight: 3
                        }).addTo(map);
                    }
                } catch (e) {
                    console.error('Erreur parsing geometry:', e);
                }
            }
        });

        // Ajouter les marqueurs
        allCoords.forEach((coord, index) => {
            const isFirst = index === 0;
            const isLast = index === allCoords.length - 1;

            const color = isFirst ? '#10b981' : isLast ? '#ef4444' : '#BB487C';

            L.circleMarker(coord, {
                radius: isFirst || isLast ? 6 : 4,
                fillColor: color,
                color: 'white',
                weight: 2,
                fillOpacity: 1
            }).addTo(map);
        });

        if (allCoords.length > 0) {
            const bounds = L.latLngBounds(allCoords);
            map.fitBounds(bounds, { padding: [10, 10] });
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [segments]);

    return (
        <div
            ref={mapRef}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px'
            }}
        />
    );
}