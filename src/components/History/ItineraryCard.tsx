import { Trash2 } from 'lucide-react';
import { ConvoyThumbnail } from './ConvoyThumbnail';
import type { ItineraryResponse, SegmentResponse } from '../../customObject/Itinerary/netTypes';

interface ItineraryCardProps {
    itinerary: ItineraryResponse;
    onOpen: (id: number) => void;
    onDelete: (id: number) => void;
}

function getStatus(itinerary: ItineraryResponse): 'draft' | 'finalized' {
    return itinerary.segments.every(s => s.waypoints.length >= 2) ? 'finalized' : 'draft';
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

function formatDistance(meters: number): string {
    return `${(meters * 0.001).toFixed(0)} km`;
}

function countPoints(segments: SegmentResponse[]): number {
    return segments.reduce((sum, s) => sum + s.waypoints.length, 0);
}

function getStartCity(segments: SegmentResponse[]): string {
    return segments[0]?.waypoints[0]?.name || 'Départ';
}

function getEndCity(segments: SegmentResponse[]): string {
    const last = segments[segments.length - 1];
    return last?.waypoints[last.waypoints.length - 1]?.name || 'Arrivée';
}

export function ItineraryCard({ itinerary, onOpen, onDelete }: ItineraryCardProps) {
    const status = getStatus(itinerary);

    return (
        <div className="ch-card">
            <div className="ch-thumb">
                <ConvoyThumbnail segments={itinerary.segments} />
            </div>

            <div className="ch-info">
                <div className="ch-title-row">
                    <h3 className="ch-title">{itinerary.name}</h3>
                    <span className={`ch-badge ${status}`}>
                        {status === 'draft' ? 'Brouillon' : 'Finalisé'}
                    </span>
                </div>

                <div className="ch-route">
                    {getStartCity(itinerary.segments)} → {getEndCity(itinerary.segments)}
                </div>

                <div className="ch-stats">
                    <span>{countPoints(itinerary.segments)} points</span>
                    <span className="ch-dot">•</span>
                    <span>{formatDistance(itinerary.totalDistance)}</span>
                    <span className="ch-dot">•</span>
                    <span>{formatDuration(itinerary.totalDuration)}</span>
                </div>
            </div>

            <div className="ch-actions">
                <button className="ch-btn-open" onClick={() => onOpen(itinerary.id)}>
                    Ouvrir ›
                </button>
                <button
                    className="ch-btn-icon"
                    onClick={() => onDelete(itinerary.id)}
                    title="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}