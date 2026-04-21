import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import type { SegmentResponse } from '../../customObject/Itinerary/netTypes';
import 'leaflet/dist/leaflet.css';
import { extractLineStringCoordinates } from '../../customObject/Itinerary/gpx.ts';

interface ConvoyThumbnailProps {
    segments: SegmentResponse[];
}

export function ConvoyThumbnail({ segments }: ConvoyThumbnailProps) {
    const allCoords: [number, number][] = [];
    segments.forEach(seg => {
        seg.waypoints.forEach(wp => {
            allCoords.push([wp.coordinates.latitude, wp.coordinates.longitude]);
        });
    });

    if (allCoords.length === 0) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                background: '#f0f0f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
            }}>
                Pas de données
            </div>
        );
    }

    const latitudes = allCoords.map(c => c[0]);
    const longitudes = allCoords.map(c => c[1]);
    const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
    const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

    // Extraire les routes (polylines)
    const routes: [number, number][][] = [];
    segments.forEach(seg => {
        if (seg.geometry) {
            try {
                const coordinates = extractLineStringCoordinates(seg.geometry);
                if (coordinates.length > 0) {
                    const latlngs = coordinates.map((coord) =>
                        [coord[1], coord[0]] as [number, number]
                    );
                    routes.push(latlngs);
                }
            } catch (e) {
                console.error('Erreur parsing geometry:', e);
            }
        }
    });

    return (
        <MapContainer
            center={[centerLat, centerLng]}
            zoom={10}
            style={{ width: '100%', height: '100%', borderRadius: '8px' }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            attributionControl={false}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {routes.map((route, idx) => (
                <Polyline
                    key={`route-${idx}`}
                    positions={route}
                    color="#BB487C"
                    weight={3}
                />
            ))}

            {/* Marqueurs */}
            {allCoords.map((coord, index) => {
                const isFirst = index === 0;
                const isLast = index === allCoords.length - 1;
                const color = isFirst ? '#10b981' : isLast ? '#ef4444' : '#BB487C';

                return (
                    <CircleMarker
                        key={`marker-${index}`}
                        center={coord}
                        radius={isFirst || isLast ? 6 : 4}
                        fillColor={color}
                        color="white"
                        weight={2}
                        fillOpacity={1}
                    />
                );
            })}
        </MapContainer>
    );
}
