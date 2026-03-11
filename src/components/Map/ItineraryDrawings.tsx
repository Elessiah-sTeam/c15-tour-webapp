import {useEffect, useMemo, useRef} from "react";
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";
import type {Itinerary, Segment} from "../../customObject/Itinerary/types.ts";
import type {Feature, LineString} from "geojson";
import type {GeoJSON as LeafletGeoJSON} from "leaflet";
import {GeoJSON} from "react-leaflet";

function GeometryLayer({segmentId, geometry}: { segmentId: string; geometry: Feature<LineString> }) {
    const layerRef = useRef<LeafletGeoJSON | null>(null);

    // react-leaflet's GeoJSON doesn't reliably "replace" data on prop change.
    // We explicitly clear & re-add so reorders that change geometry are reflected.
    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;
        layer.clearLayers();
        layer.addData(geometry as never);
    }, [geometry]);

    // Force a remount if geometry is structurally different (defensive).
    const geometryKey = useMemo(() => {
        const coords = geometry.geometry?.coordinates;
        const first = Array.isArray(coords) ? coords[0] : undefined;
        const last = Array.isArray(coords) ? coords[coords.length - 1] : undefined;
        return `${segmentId}:${JSON.stringify(first)}:${JSON.stringify(last)}:${(coords as unknown[] | undefined)?.length ?? 0}`;
    }, [geometry, segmentId]);

    return <GeoJSON key={geometryKey} ref={layerRef} data={geometry}/>;
}

export default function ItineraryDrawings() {
    const itinerary: Itinerary = useItinerary(itineraryModel.store);

    return (
        <>
            {itinerary.segments.map((seg: Segment) => {
                if (!seg.content.geometry) return null;
                return <GeometryLayer key={seg.id} segmentId={seg.id} geometry={seg.content.geometry}/>;
            })}
        </>
    );
}