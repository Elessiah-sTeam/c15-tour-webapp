import { Trash2, Share2, Download } from "lucide-react";
import { ConvoyThumbnail } from "./ConvoyThumbnail";
import type { ItineraryResponse, SegmentResponse } from "../../customObject/Itinerary/netTypes";
import { downloadGpx, hasGpxGeometry } from "../../customObject/Itinerary/gpx.ts";

interface ItineraryCardProps {
    itinerary: ItineraryResponse;
    onOpen: (id: number) => void;
    onDelete: (id: number) => void;
    onShare: (shareCode: string) => void;
}

function getStatus(itinerary: ItineraryResponse): "draft" | "finalized" {
    return itinerary.segments.every(s => s.waypoints.length >= 2) ? "finalized" : "draft";
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`;
}

function formatDistance(meters: number): string {
    return `${(meters * 0.001).toFixed(0)} km`;
}

function countPoints(segments: SegmentResponse[]): number {
    return segments.reduce((sum, s) => sum + s.waypoints.length, 0);
}

function formatCreatedAt(createdAt?: string): string {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStartCity(segments: SegmentResponse[]): string {
    return segments[0]?.waypoints[0]?.name || "D\u00e9part";
}

function getEndCity(segments: SegmentResponse[]): string {
    const last = segments[segments.length - 1];
    return last?.waypoints[last.waypoints.length - 1]?.name || "Arriv\u00e9e";
}

export function ItineraryCard({ itinerary, onOpen, onDelete, onShare }: ItineraryCardProps) {
    const status = getStatus(itinerary);
    const canDownloadGpx = hasGpxGeometry(itinerary.segments.map((segment) => ({
        geometry: segment.geometry,
    })));
    const downloadLabel = canDownloadGpx
        ? "T\u00e9l\u00e9charger le GPX"
        : "T\u00e9l\u00e9chargement GPX indisponible";
    const shareLabel = itinerary.shareCode
        ? "Partager"
        : "Partage indisponible";
    const deleteLabel = "Supprimer";

    return (
        <div className="ch-card">
            <div className="ch-thumb">
                <ConvoyThumbnail segments={itinerary.segments} />
            </div>

            <div className="ch-info">
                <div className="ch-title-row">
                    <h3 className="ch-title">{itinerary.name}</h3>
                    <span className={`ch-badge ${status}`}>
                        {status === "draft" ? "Brouillon" : "Finalis\u00e9"}
                    </span>
                </div>

                <div className="ch-route">
                    {getStartCity(itinerary.segments)} {"\u2192"} {getEndCity(itinerary.segments)}
                </div>

                <div className="ch-stats">
                    <span>{countPoints(itinerary.segments)} points</span>
                    <span className="ch-dot">{"\u2022"}</span>
                    <span>{formatDistance(itinerary.totalDistance)}</span>
                    <span className="ch-dot">{"\u2022"}</span>
                    <span>{formatDuration(itinerary.totalDuration)}</span>
                </div>
                {itinerary.createdAt && (
                    <div className="ch-date">Cr\u00e9\u00e9 le {formatCreatedAt(itinerary.createdAt)}</div>
                )}
            </div>

            <div className="ch-actions">
                <button className="ch-btn-open" onClick={() => onOpen(itinerary.id)}>
                    {"Ouvrir \u203a"}
                </button>
                <div className="ch-actions-row">
                    <button
                        className="ch-btn-icon"
                        onClick={() => downloadGpx(itinerary.name, itinerary.segments.map((segment) => ({
                            geometry: segment.geometry,
                        })))}
                        aria-label={downloadLabel}
                        title={downloadLabel}
                        disabled={!canDownloadGpx}
                    >
                        <Download size={16} color={canDownloadGpx ? "#BB487C" : "#ccc"} />
                    </button>
                    <button
                        className="ch-btn-icon"
                        onClick={() => itinerary.shareCode && onShare(itinerary.shareCode)}
                        aria-label={shareLabel}
                        title={shareLabel}
                        disabled={!itinerary.shareCode}
                    >
                        <Share2 size={16} color={itinerary.shareCode ? "#BB487C" : "#ccc"} />
                    </button>
                    <button
                        className="ch-btn-icon"
                        onClick={() => onDelete(itinerary.id)}
                        aria-label={deleteLabel}
                        title={deleteLabel}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
