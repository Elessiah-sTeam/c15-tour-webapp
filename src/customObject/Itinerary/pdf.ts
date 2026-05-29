import type { Itinerary, Segment } from "./types.ts";
import { extractLineStringCoordinates } from "./gpx.ts";
import { sanitizeFileName } from "./fileName.ts";
import { drawOsmTilesAndProjector, type LatLon } from "./pdfMapTiles.ts";

const PAGE_CANVAS_WIDTH = 1240;
const PAGE_CANVAS_HEIGHT = 1754;
const PDF_PAGE_WIDTH_PT = 595.28;
const PDF_PAGE_HEIGHT_PT = 841.89;
const EXPORT_ACCENT = "#BB487C";
const EXPORT_ACCENT_DARK = "#7B1D57";
const EXPORT_PANEL = "rgba(255, 255, 255, 0.82)";
const EXPORT_PANEL_BORDER = "rgba(187, 72, 124, 0.18)";
const PDF_ROUTE_HALO_WIDTH = 6;
const PDF_ROUTE_LINE_WIDTH = 3.2;
const PDF_SECTION_ROUTE_HALO_WIDTH = PDF_ROUTE_HALO_WIDTH;
const PDF_SECTION_ROUTE_LINE_WIDTH = PDF_ROUTE_LINE_WIDTH;
const PDF_OVERVIEW_LON_LAT_PAD = 0.12;
const PDF_SECTION_LON_LAT_PAD = 0.32;

type RoutePoint = {
    lat: number;
    lon: number;
    label?: string;
};

type ExportSection = {
    title: string;
    subtitle: string;
    durationLabel: string;
    distanceLabel: string;
    departureLabel: string;
    stepTitles: string[];
    routePoints: RoutePoint[];
};

type PdfBinary = Uint8Array;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => resolve());
    });
}

function formatDistance(distanceKm: number): string {
    if (!Number.isFinite(distanceKm)) {
        return "Distance inconnue";
    }

    const roundedDistance = Math.round(distanceKm * 10) / 10;
    const fractionDigits = Number.isInteger(roundedDistance) ? 0 : 1;

    return `${new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: 1,
    }).format(roundedDistance)} km`;
}

function formatDuration(durationMs: number): string {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
        return "0 min";
    }

    const totalMinutes = Math.round(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes} min`;
    }

    if (minutes === 0) {
        return `${hours} h`;
    }

    return `${hours} h ${minutes.toString().padStart(2, "0")}`;
}

function formatDateTime(date: Date | undefined): string {
    if (!date) {
        return "Date inconnue";
    }

    const normalized = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(normalized.getTime())) {
        return "Date inconnue";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(normalized);
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Impossible de préparer le canvas PDF.");
    }
    return context;
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawShadowedPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string,
): void {
    ctx.save();
    ctx.shadowColor = "rgba(111, 22, 70, 0.14)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = fillStyle;
    roundRect(ctx, x, y, width, height, radius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = EXPORT_PANEL_BORDER;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();
    ctx.restore();
}

function drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options: {
        size?: number;
        weight?: number;
        color?: string;
        align?: CanvasTextAlign;
        baseline?: CanvasTextBaseline;
        maxWidth?: number;
    } = {},
): void {
    ctx.save();
    ctx.fillStyle = options.color ?? "#2E2430";
    ctx.font = `${options.weight ?? 600} ${options.size ?? 28}px "Montserrat", "Segoe UI", sans-serif`;
    ctx.textAlign = options.align ?? "left";
    ctx.textBaseline = options.baseline ?? "top";
    if (options.maxWidth) {
        ctx.fillText(text, x, y, options.maxWidth);
    } else {
        ctx.fillText(text, x, y);
    }
    ctx.restore();
}

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return [""];
    }

    const lines: string[] = [];
    let current = words[0];

    for (let i = 1; i < words.length; i += 1) {
        const candidate = `${current} ${words[i]}`;
        if (ctx.measureText(candidate).width <= maxWidth) {
            current = candidate;
        } else {
            lines.push(current);
            current = words[i];
        }
    }

    lines.push(current);
    return lines;
}

function drawParagraph(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    options: { size?: number; weight?: number; color?: string; maxLines?: number } = {},
): number {
    ctx.save();
    ctx.font = `${options.weight ?? 500} ${options.size ?? 24}px "Montserrat", "Segoe UI", sans-serif`;
    const lines = wrapText(ctx, text, maxWidth);
    ctx.fillStyle = options.color ?? "#2E2430";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const limit = options.maxLines ?? lines.length;
    const visible = lines.slice(0, limit);
    visible.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight, maxWidth);
    });
    ctx.restore();

    return visible.length * lineHeight;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) {
        return text;
    }

    const ellipsis = "…";
    let low = 0;
    let high = text.length;

    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        const candidate = `${text.slice(0, mid).trimEnd()}${ellipsis}`;
        if (ctx.measureText(candidate).width <= maxWidth) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    return `${text.slice(0, low).trimEnd()}${ellipsis}`;
}

function drawMapLegendCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    markerColor: string,
    label: string,
    value: string,
): void {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.strokeStyle = "rgba(187, 72, 124, 0.20)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, width, 56, 18);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawText(ctx, label, x + 36, y + 8, {
        size: 14,
        weight: 800,
        color: "#6A4960",
    });
    drawText(ctx, fitText(ctx, value, width - 52), x + 36, y + 28, {
        size: 16,
        weight: 800,
        color: "#4F3342",
    });
}

/**
 * Projette un point géographique sur le canvas en utilisant une mise à l'échelle
 * linéaire lon/lat (approximation « plate »), pour repli quand les tuiles OSM ne sont pas disponibles.
 *
 * @param point — Coordonnées en degrés décimaux.
 * @param bounds — Emprise normalisée (min/max lat/lon) avec marge déjà appliquée si besoin.
 * @param box — Rectangle cible et fraction `padding` réservée sur les bords.
 */
function toCanvasPointEquirectangular(
    point: { lat: number; lon: number },
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
    box: { x: number; y: number; width: number; height: number; padding: number },
): { x: number; y: number } {
    const innerWidth = box.width * (1 - box.padding * 2);
    const innerHeight = box.height * (1 - box.padding * 2);
    const usableWidth = Math.max(innerWidth, 1);
    const usableHeight = Math.max(innerHeight, 1);

    const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.00001);
    const lonRange = Math.max(bounds.maxLon - bounds.minLon, 0.00001);

    const lonRatio = (point.lon - bounds.minLon) / lonRange;
    const latRatio = (bounds.maxLat - point.lat) / latRange;

    return {
        x: box.x + box.width * box.padding + lonRatio * usableWidth,
        y: box.y + box.height * box.padding + latRatio * usableHeight,
    };
}

/** Nombre maximum de sommets conservés par tronçon avant tracé sur le canvas PDF (performance / taille JPEG). */
const PDF_ROUTE_MAX_VERTICES = 2_400;

/**
 * Réduit une liste de points en conservant le premier, des points espacés régulièrement, et le dernier.
 *
 * @param points — Sommets du tracé dans l'ordre du parcours.
 * @param maxVertices — Plafond cible ; si `points.length` est inférieur ou égal, la liste est renvoyée telle quelle.
 */
function decimateRoutePoints(points: RoutePoint[], maxVertices: number): RoutePoint[] {
    if (points.length <= maxVertices) {
        return points;
    }
    const step = Math.ceil(points.length / maxVertices);
    const out: RoutePoint[] = [];
    for (let i = 0; i < points.length; i += step) {
        out.push(points[i]);
    }
    const last = points[points.length - 1];
    if (out[out.length - 1] !== last) {
        out.push(last);
    }
    return out;
}

/**
 * Aplatit plusieurs polylignes en une liste de coordonnées `{ lat, lon }` (ordre : tronçons puis points).
 *
 * @param routes — Tableau de tracés ; les points non finis sont ignorés.
 */
function flattenRoutesLatLon(routes: RoutePoint[][]): LatLon[] {
    const out: LatLon[] = [];
    routes.forEach((route) => {
        route.forEach((p) => {
            if (Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
                out.push({ lat: p.lat, lon: p.lon });
            }
        });
    });
    return out;
}

/**
 * Dessine le fond de secours (dégradé + grille) lorsque la carte tuilée n'est pas affichée.
 *
 * @param ctx — Contexte du canvas page PDF.
 * @param x — Origine X du bloc carte.
 * @param y — Origine Y du bloc carte.
 * @param width — Largeur du bloc carte.
 * @param height — Hauteur du bloc carte.
 */
function drawFallbackGrid(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#FFFDFD");
    gradient.addColorStop(1, "#F8EEF5");
    roundRect(ctx, x, y, width, height, 30);
    ctx.fillStyle = gradient;
    ctx.fill();

    for (let row = 0; row < 12; row += 1) {
        const lineY = y + (height / 12) * row;
        ctx.strokeStyle = row % 3 === 0 ? "rgba(187, 72, 124, 0.12)" : "rgba(46, 36, 48, 0.06)";
        ctx.lineWidth = row % 3 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + width, lineY);
        ctx.stroke();
    }

    for (let column = 0; column < 14; column += 1) {
        const lineX = x + (width / 14) * column;
        ctx.strokeStyle = column % 4 === 0 ? "rgba(187, 72, 124, 0.10)" : "rgba(46, 36, 48, 0.05)";
        ctx.lineWidth = column % 4 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(lineX, y);
        ctx.lineTo(lineX, y + height);
        ctx.stroke();
    }
}

/**
 * Dessine le bloc « carte + trajet » pour le PDF : tuiles OSM si possible, tracés vectoriels, marqueurs départ/arrivée.
 *
 * @param ctx — Contexte du canvas page.
 * @param x — Origine X du bloc (coins arrondis, zone clipée localement).
 * @param y — Origine Y du bloc.
 * @param width — Largeur du bloc.
 * @param height — Hauteur du bloc.
 * @param routes — Une ou plusieurs polylignes (vue d'ensemble = un tableau par tronçon). Les tracés de moins de 2 points sont ignorés.
 * @param title — Sous-titre affiché dans l'étiquette (ex. nom du convoi ou du tronçon).
 * @param options.variant — `"overview"` : pas de pastilles intermédiaires ; `"section"` : pastilles sur les étapes pour un seul tronçon.
 * @remarks Effectue des requêtes réseau lorsque les tuiles OSM sont utilisées. Restaure le contexte (`ctx.restore`) après tracé.
 */
async function drawRouteSnapshot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    routes: RoutePoint[][],
    title: string,
    options: { variant: "section" | "overview"; showOverlayLabel?: boolean },
): Promise<void> {
    const routesWithPath = routes.filter((route) => route.length >= 2);
    const legendHeight = routesWithPath.length > 0 ? 88 : 0;
    const mapY = y + legendHeight;
    const mapHeight = height - legendHeight;
    const box = { x, y: mapY, width, height: mapHeight, padding: 0.08 };

    ctx.save();
    roundRect(ctx, x, y, width, height, 30);
    ctx.clip();

    if (routesWithPath.length === 0) {
        drawFallbackGrid(ctx, x, mapY, width, mapHeight);
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.80)";
        ctx.strokeStyle = "rgba(187, 72, 124, 0.20)";
        ctx.lineWidth = 2;
        roundRect(ctx, x + 42, mapY + mapHeight / 2 - 60, width - 84, 120, 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(ctx, "Aucun trajet d\u00e9taill\u00e9", x + width / 2, mapY + mapHeight / 2 - 10, {
            size: 30,
            weight: 800,
            color: EXPORT_ACCENT_DARK,
            align: "center",
        });
        drawText(ctx, "Ajoutez des points de passage pour g\u00e9n\u00e9rer un aper\u00e7u visuel.", x + width / 2, mapY + mapHeight / 2 + 36, {
            size: 18,
            weight: 500,
            color: "#6B5563",
            align: "center",
        });
        ctx.restore();
        return;
    }

    const firstRoute = routesWithPath[0];
    const lastRoute = routesWithPath[routesWithPath.length - 1];
    const firstPoint = firstRoute[0];
    const lastPoint = lastRoute[lastRoute.length - 1];

    const flat = flattenRoutesLatLon(routesWithPath);
    const latitudes = flat.map((point) => point.lat);
    const longitudes = flat.map((point) => point.lon);
    const latSpan = Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.01);
    const lonSpan = Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.01);
    const eBounds = {
        minLat: Math.min(...latitudes) - latSpan * (options.variant === "section" ? PDF_SECTION_LON_LAT_PAD : PDF_OVERVIEW_LON_LAT_PAD),
        maxLat: Math.max(...latitudes) + latSpan * (options.variant === "section" ? PDF_SECTION_LON_LAT_PAD : PDF_OVERVIEW_LON_LAT_PAD),
        minLon: Math.min(...longitudes) - lonSpan * (options.variant === "section" ? PDF_SECTION_LON_LAT_PAD : PDF_OVERVIEW_LON_LAT_PAD),
        maxLon: Math.max(...longitudes) + lonSpan * (options.variant === "section" ? PDF_SECTION_LON_LAT_PAD : PDF_OVERVIEW_LON_LAT_PAD),
    };

    const projector = await drawOsmTilesAndProjector(ctx, { x, y: mapY, width, height: mapHeight }, routesWithPath, {
        padding: box.padding,
        maxTiles: 20,
        lonLatPad: options.variant === "section" ? PDF_SECTION_LON_LAT_PAD : PDF_OVERVIEW_LON_LAT_PAD,
    });

    if (!projector.drawn) {
        drawFallbackGrid(ctx, x, mapY, width, mapHeight);
    }

    const projectPoint = (point: RoutePoint): { x: number; y: number } => {
        if (projector.drawn) {
            return projector.project({ lat: point.lat, lon: point.lon });
        }
        return toCanvasPointEquirectangular(point, eBounds, box);
    };

    const strokePolyline = (mapped: { x: number; y: number }[], lineWidth: number, strokeStyle: string): void => {
        if (mapped.length < 2) {
            return;
        }
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        mapped.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        ctx.restore();
    };

    routesWithPath.forEach((route) => {
        const decimated = decimateRoutePoints(route, PDF_ROUTE_MAX_VERTICES);
        const mapped = decimated.map(projectPoint);
        const haloWidth = options.variant === "section" ? PDF_SECTION_ROUTE_HALO_WIDTH : PDF_ROUTE_HALO_WIDTH;
        const lineWidth = options.variant === "section" ? PDF_SECTION_ROUTE_LINE_WIDTH : PDF_ROUTE_LINE_WIDTH;
        strokePolyline(mapped, haloWidth, "rgba(125, 29, 87, 0.22)");
        strokePolyline(mapped, lineWidth, EXPORT_ACCENT);
    });
    const firstMapped = projectPoint(firstPoint);
    const lastMapped = projectPoint(lastPoint);

    const drawMarker = (point: { x: number; y: number }, color: string, innerColor = "#FFFFFF"): void => {
        ctx.save();
        ctx.shadowColor = "rgba(93, 17, 62, 0.24)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const showIntermediate =
        options.variant === "section" && routesWithPath.length === 1 && routesWithPath[0].length >= 3;

    if (showIntermediate) {
        const decimated = decimateRoutePoints(routesWithPath[0], PDF_ROUTE_MAX_VERTICES);
        decimated.forEach((routePoint, index) => {
            if (index === 0 || index === decimated.length - 1 || !routePoint.label) {
                return;
            }
            const point = projectPoint(routePoint);
            ctx.save();
            ctx.fillStyle = EXPORT_ACCENT;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawMarker(firstMapped, "#16A34A");
    drawMarker(lastMapped, "#E11D48");

    if (firstPoint && lastPoint) {
        const legendWidth = (width - 16) / 2;
        drawMapLegendCard(
            ctx,
            x + 8,
            y + 8,
            legendWidth - 8,
            "#16A34A",
            "Point de d\u00e9part",
            firstPoint.label ?? "D\u00e9part",
        );
        drawMapLegendCard(
            ctx,
            x + width - legendWidth,
            y + 8,
            legendWidth - 8,
            "#E11D48",
            "Point d'arriv\u00e9e",
            lastPoint.label ?? "Arriv\u00e9e",
        );
    }

    if (options.showOverlayLabel !== false) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
        ctx.strokeStyle = "rgba(187, 72, 124, 0.18)";
        ctx.lineWidth = 2;
        roundRect(ctx, x + 24, mapY + 24, 280, 64, 18);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(ctx, projector.drawn ? "Carte du trajet" : "Aper\u00e7u du trajet", x + 44, mapY + 41, {
            size: 22,
            weight: 800,
            color: EXPORT_ACCENT_DARK,
        });
        drawText(ctx, title, x + 44, mapY + 68, {
            size: 16,
            weight: 500,
            color: "#67425B",
            maxWidth: 220,
        });
    }

    if (projector.drawn) {
        drawText(ctx, "\u00a9 OpenStreetMap contributors", x + width - 22, mapY + mapHeight - 20, {
            size: 13,
            weight: 600,
            color: "rgba(46, 36, 48, 0.72)",
            align: "right",
        });
    }

    ctx.restore();
}

/**
 * Extrait les points à tracer pour un segment : géométrie LineString prioritaire, sinon étapes avec coordonnées.
 * Met à jour les libellés du premier et du dernier point à partir des étapes si possible.
 *
 * @param segment — Segment métier (non nécessairement exclus `isStartEnd` ; filtrage à la charge de l'appelant).
 * @returns Liste de points (peut être vide ou un seul point si données insuffisantes).
 */
function collectRoutePoints(segment: Segment): RoutePoint[] {
    const geometryPoints: RoutePoint[] = extractLineStringCoordinates(segment.content.geometry).map(([lon, lat]) => ({
        lat,
        lon,
    }));

    if (geometryPoints.length >= 2) {
        const firstStep = segment.steps.find((step) => step.content.location);
        const lastStep = [...segment.steps].reverse().find((step) => step.content.location);

        if (geometryPoints.length > 0) {
            geometryPoints[0] = {
                ...geometryPoints[0],
                label: firstStep?.content.title?.trim() || "D\u00e9part",
            };
            geometryPoints[geometryPoints.length - 1] = {
                ...geometryPoints[geometryPoints.length - 1],
                label: lastStep?.content.title?.trim() || "Arriv\u00e9e",
            };
        }

        return geometryPoints;
    }

    const stepPoints: RoutePoint[] = segment.steps
        .filter((step) => step.content.location)
        .map((step) => ({
            lat: step.content.location!.lat,
            lon: step.content.location!.lon,
            label: step.content.title.trim(),
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));

    if (stepPoints.length >= 2) {
        return stepPoints;
    }

    return geometryPoints.length > 0 ? geometryPoints : stepPoints;
}

/**
 * Extrait les tronçons exportables d'un itinéraire pour préparer les pages du PDF.
 * Les segments techniques de début et de fin sont ignorés afin de ne garder que
 * les trajets réellement illustrés dans le document.
 *
 * @param itinerary — Itinéraire source à analyser.
 * @returns Liste des tronçons à transformer en pages PDF (champ `routePoints` alimenté pour la carte).
 */
export function collectPdfSections(itinerary: Itinerary): ExportSection[] {
    return itinerary.segments
        .filter((segment) => !segment.isStartEnd)
        .map((segment) => {
            const stepTitles = segment.steps
                .map((step) => step.content.title.trim())
                .filter((title) => title.length > 0);

            return {
                title: segment.content.title.trim() || "Trajet sans nom",
                subtitle: segment.steps.length > 0
                    ? `${segment.steps.length} \u00e9tape${segment.steps.length > 1 ? "s" : ""}`
                    : "Sans \u00e9tape",
                durationLabel: formatDuration(segment.content.duration.duration),
                distanceLabel: formatDistance(segment.content.distance),
                departureLabel: formatDateTime(segment.content.hour),
                stepTitles,
                routePoints: collectRoutePoints(segment),
            };
        });
}

/**
 * Construit la liste de polylignes pour la carte de couverture : sections exportables d'abord,
 * sinon tous les segments non « start/end » de l'itinéraire ayant au moins deux points.
 *
 * @param itinerary — Itinéraire source complet.
 * @param sections — Tronçons déjà filtrés pour le PDF (`collectPdfSections`).
 * @returns Tableau de tracés (chacun = 2 points), possiblement vide.
 */
function overviewRoutesForCover(itinerary: Itinerary, sections: ExportSection[]): RoutePoint[][] {
    const fromSections = sections.map((section) => section.routePoints).filter((route) => route.length >= 2);
    if (fromSections.length > 0) {
        return fromSections;
    }
    return itinerary.segments
        .filter((segment) => !segment.isStartEnd)
        .map((segment) => collectRoutePoints(segment))
        .filter((route) => route.length >= 2);
}

/**
 * Génère le canvas de la page de couverture du PDF (titre, carte d'ensemble, récapitulatif, liste des tronçons).
 *
 * @param itinerary — Itinéraire à présenter.
 * @param sections — Tronçons détaillés issus de {@link collectPdfSections}.
 * @returns Canvas haute résolution prêt pour encodage JPEG puis inclusion PDF.
 * @remarks Asynchrone : chargement des tuiles cartographiques pour la vue d'ensemble.
 */
async function buildCoverCanvas(itinerary: Itinerary, sections: ExportSection[]): Promise<HTMLCanvasElement> {
    const canvas = createCanvas(PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
    const ctx = getContext(canvas);

    const background = ctx.createLinearGradient(0, 0, PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
    background.addColorStop(0, "#FFFDFE");
    background.addColorStop(1, "#F9ECF3");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);

    ctx.save();
    ctx.fillStyle = "rgba(187, 72, 124, 0.08)";
    ctx.beginPath();
    ctx.arc(PAGE_CANVAS_WIDTH + 140, 130, 340, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(123, 29, 87, 0.10)";
    ctx.beginPath();
    ctx.arc(-90, PAGE_CANVAS_HEIGHT - 180, 340, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawText(ctx, "C15 TOUR", 88, 74, {
        size: 24,
        weight: 900,
        color: EXPORT_ACCENT,
    });

    drawText(ctx, "Export PDF de l'itin\u00e9raire", 88, 146, {
        size: 58,
        weight: 900,
        color: EXPORT_ACCENT_DARK,
    });

    const title = itinerary.name.trim() || "Itin\u00e9raire sans nom";
    drawParagraph(ctx, title, 88, 226, PAGE_CANVAS_WIDTH * 0.62, 56, {
        size: 42,
        weight: 700,
        color: "#2E2430",
        maxLines: 2,
    });

    drawText(ctx, "Vue d'ensemble", 88, 344, {
        size: 22,
        weight: 800,
        color: EXPORT_ACCENT,
    });
    drawText(ctx, "Itin\u00e9raire complet sur la carte", 88, 376, {
        size: 18,
        weight: 600,
        color: "#6B5563",
    });

    drawShadowedPanel(ctx, 84, 402, 1072, 700, 34, EXPORT_PANEL);
    await drawRouteSnapshot(ctx, 108, 438, 1024, 628, overviewRoutesForCover(itinerary, sections), title, {
        variant: "overview",
        showOverlayLabel: false,
    });

    drawShadowedPanel(ctx, 84, 1118, 1072, 170, 30, EXPORT_PANEL);
    const summaryCards = [
        {
            label: "Segments d\u00e9taill\u00e9s",
            value: `${sections.length}`,
        },
        {
            label: "Distance totale",
            value: formatDistance(itinerary.totalDistance),
        },
        {
            label: "Dur\u00e9e totale",
            value: formatDuration(itinerary.totalDuration.duration),
        },
        {
            label: "G\u00e9n\u00e9r\u00e9 le",
            value: new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(new Date()),
        },
    ];

    summaryCards.forEach((card, index) => {
        const cardWidth = 242;
        const gap = 18;
        const cardX = 112 + index * (cardWidth + gap);
        const cardY = 1142;

        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
        ctx.strokeStyle = EXPORT_PANEL_BORDER;
        ctx.lineWidth = 2;
        roundRect(ctx, cardX, cardY, cardWidth, 120, 22);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(ctx, card.label, cardX + 20, cardY + 18, {
            size: 18,
            weight: 700,
            color: "#6A4960",
        });
        drawParagraph(ctx, card.value, cardX + 20, cardY + 48, cardWidth - 40, 28, {
            size: card.value.length > 18 ? 18 : 28,
            weight: 800,
            color: EXPORT_ACCENT_DARK,
            maxLines: 2,
        });
    });

    drawShadowedPanel(ctx, 84, 1322, 1072, 390, 34, "rgba(255, 255, 255, 0.88)");
    drawText(ctx, "Tron\u00e7ons export\u00e9s", 118, 1360, {
        size: 24,
        weight: 800,
        color: EXPORT_ACCENT_DARK,
    });
    drawText(ctx, "Un aper\u00e7u d\u00e9taill\u00e9 sera g\u00e9n\u00e9r\u00e9 pour chaque segment.", 118, 1394, {
        size: 18,
        weight: 500,
        color: "#6B5563",
    });

    if (sections.length === 0) {
        drawText(ctx, "Aucun segment d\u00e9taill\u00e9 n'a \u00e9t\u00e9 trouv\u00e9.", 118, 1450, {
            size: 30,
            weight: 800,
            color: EXPORT_ACCENT,
        });
        drawParagraph(
            ctx,
            "Ajoutez des points de passage et des tron\u00e7ons calcul\u00e9s pour obtenir un PDF illustr\u00e9 avec un aper\u00e7u du trajet.",
            118,
            1500,
            970,
            34,
            {
                size: 24,
                weight: 500,
                color: "#53404A",
                maxLines: 4,
            },
        );
    } else {
        sections.slice(0, 5).forEach((section, index) => {
            const rowY = 1444 + index * 52;
            ctx.save();
            ctx.font = '800 20px "Montserrat", "Segoe UI", sans-serif';
            const sectionTitle = fitText(ctx, section.title, 520);
            ctx.restore();

            ctx.save();
            ctx.font = '700 17px "Montserrat", "Segoe UI", sans-serif';
            const sectionSubtitle = fitText(ctx, section.subtitle, 280);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = "rgba(248, 236, 243, 0.92)";
            roundRect(ctx, 118, rowY, 1004, 60, 18);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = EXPORT_ACCENT;
            ctx.beginPath();
            ctx.arc(146, rowY + 30, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            drawText(ctx, `${index + 1}`, 146, rowY + 30, {
                size: 18,
                weight: 900,
                color: "#FFFFFF",
                align: "center",
                baseline: "middle",
            });
            drawText(ctx, sectionTitle, 174, rowY + 30, {
                size: 20,
                weight: 800,
                color: "#2E2430",
                baseline: "middle",
            });
            drawText(ctx, sectionSubtitle, 1088, rowY + 30, {
                size: 17,
                weight: 700,
                color: "#6A4960",
                align: "right",
                baseline: "middle",
            });
        });
    }

    return canvas;
}

/**
 * Génère le canvas d'une page « tronçon » : carte du segment, indicateurs, liste des étapes.
 *
 * @param itinerary — Itinéraire parent (en-tête de page).
 * @param section — Données du tronçon courant.
 * @param index — Index 0-based du tronçon dans la liste exportée.
 * @param total — Nombre total de tronçons exportés.
 * @returns Canvas page segment.
 * @remarks Asynchrone : même pipeline tuiles + tracé que la couverture.
 */
async function buildSectionCanvas(
    itinerary: Itinerary,
    section: ExportSection,
    index: number,
    total: number,
): Promise<HTMLCanvasElement> {
    const canvas = createCanvas(PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
    const ctx = getContext(canvas);

    const background = ctx.createLinearGradient(0, 0, PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
    background.addColorStop(0, "#FFFDFE");
    background.addColorStop(1, "#F7EEF4");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);

    ctx.save();
    ctx.fillStyle = "rgba(187, 72, 124, 0.08)";
    ctx.beginPath();
    ctx.arc(PAGE_CANVAS_WIDTH - 90, 80, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawText(ctx, itinerary.name.trim() || "Itin\u00e9raire sans nom", 88, 68, {
        size: 24,
        weight: 900,
        color: EXPORT_ACCENT,
    });
    drawText(ctx, `Tron\u00e7on ${index + 1} / ${total}`, 88, 116, {
        size: 20,
        weight: 800,
        color: "#7B5A6A",
    });
    drawParagraph(ctx, section.title, 88, 158, 880, 54, {
        size: 44,
        weight: 900,
        color: EXPORT_ACCENT_DARK,
        maxLines: 2,
    });

    drawShadowedPanel(ctx, 84, 270, 1072, 872, 34, EXPORT_PANEL);
    drawText(ctx, "Carte du trajet", 120, 314, {
        size: 22,
        weight: 800,
        color: EXPORT_ACCENT_DARK,
    });
    drawText(ctx, section.title, 120, 346, {
        size: 16,
        weight: 500,
        color: "#67425B",
        maxWidth: 780,
    });
    await drawRouteSnapshot(ctx, 120, 396, 1000, 710, [section.routePoints], section.title, {
        variant: "section",
        showOverlayLabel: false,
    });

    drawShadowedPanel(ctx, 84, 1178, 1072, 450, 32, "rgba(255, 255, 255, 0.92)");
    drawText(ctx, "D\u00e9tails du tron\u00e7on", 118, 1218, {
        size: 24,
        weight: 800,
        color: EXPORT_ACCENT_DARK,
    });

    const detailColumns = [
        { label: "D\u00e9part estim\u00e9", value: section.departureLabel },
        { label: "Distance", value: section.distanceLabel },
        { label: "Dur\u00e9e", value: section.durationLabel },
        { label: "\u00c9tapes", value: section.subtitle },
    ];

    detailColumns.forEach((column, columnIndex) => {
        const columnWidth = 230;
        const gap = 20;
        const columnX = 118 + columnIndex * (columnWidth + gap);
        const columnY = 1260;

        ctx.save();
        ctx.fillStyle = "rgba(248, 236, 243, 0.94)";
        ctx.strokeStyle = "rgba(187, 72, 124, 0.16)";
        ctx.lineWidth = 2;
        roundRect(ctx, columnX, columnY, columnWidth, 114, 20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(ctx, column.label, columnX + 16, columnY + 16, {
            size: 16,
            weight: 700,
            color: "#7B5A6A",
        });
        drawParagraph(ctx, column.value, columnX + 16, columnY + 44, columnWidth - 32, 24, {
            size: column.value.length > 18 ? 17 : 22,
            weight: 800,
            color: EXPORT_ACCENT_DARK,
            maxLines: 2,
        });
    });

    drawText(ctx, "\u00c9tapes et arr\u00eats", 118, 1402, {
        size: 22,
        weight: 800,
        color: EXPORT_ACCENT,
    });

    if (section.stepTitles.length === 0) {
        drawParagraph(ctx, "Aucune \u00e9tape textuelle n'a \u00e9t\u00e9 renseign\u00e9e sur ce tron\u00e7on.", 118, 1442, 980, 30, {
            size: 20,
            weight: 500,
            color: "#54414C",
            maxLines: 4,
        });
    } else {
        section.stepTitles.slice(0, 5).forEach((stepTitle, stepIndex) => {
            const rowY = 1442 + stepIndex * 36;
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
            roundRect(ctx, 118, rowY, 1000, 36, 16);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = EXPORT_ACCENT;
            ctx.beginPath();
            ctx.arc(138, rowY + 18, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            drawText(ctx, fitText(ctx, `${stepIndex + 1}. ${stepTitle}`, 920), 160, rowY + 9, {
                size: 18,
                weight: 600,
                color: "#352B33",
            });
        });
    }

    return canvas;
}

function canvasToJpegBytes(canvas: HTMLCanvasElement): PdfBinary {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

function bytesFromAscii(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => {
        output.set(chunk, offset);
        offset += chunk.length;
    });
    return output;
}

function createPdfImageObject(imageBytes: Uint8Array, width: number, height: number): Uint8Array {
    const header = bytesFromAscii(
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
    );
    const footer = bytesFromAscii("\nendstream");
    return concatBytes([header, imageBytes, footer]);
}

function createPdfStreamObject(content: string): Uint8Array {
    const bytes = bytesFromAscii(content);
    const header = bytesFromAscii(`<< /Length ${bytes.length} >>\nstream\n`);
    const footer = bytesFromAscii("\nendstream");
    return concatBytes([header, bytes, footer]);
}

class SimplePdfWriter {
    private readonly objects: Array<Uint8Array | undefined> = [];

    addObject(body: Uint8Array): number {
        this.objects.push(body);
        return this.objects.length;
    }

    setObject(objectId: number, body: Uint8Array): void {
        this.objects[objectId - 1] = body;
    }

    build(): Uint8Array {
        const header = bytesFromAscii("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
        const chunks: Uint8Array[] = [header];
        const offsets: number[] = [0];
        let currentOffset = header.length;

        this.objects.forEach((object, index) => {
            if (!object) {
                throw new Error(`Objet PDF manquant: ${index + 1}`);
            }
            const prefix = bytesFromAscii(`${index + 1} 0 obj\n`);
            const suffix = bytesFromAscii("\nendobj\n");
            offsets[index + 1] = currentOffset;
            chunks.push(prefix, object, suffix);
            currentOffset += prefix.length + object.length + suffix.length;
        });

        const xrefOffset = currentOffset;
        const xrefParts: string[] = ["xref", `0 ${this.objects.length + 1}`, "0000000000 65535 f "];
        for (let index = 1; index <= this.objects.length; index += 1) {
            xrefParts.push(`${offsets[index].toString().padStart(10, "0")} 00000 n `);
        }
        const xref = bytesFromAscii(`${xrefParts.join("\n")}\n`);
        const trailer = bytesFromAscii(
            `trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
        );
        chunks.push(xref, trailer);
        return concatBytes(chunks);
    }
}

/**
 * Construit la liste ordonnée des pages du PDF sous forme de canvas (couverture, page vide si besoin, puis un canvas par tronçon).
 *
 * @param itinerary — Itinéraire à exporter.
 * @returns Tableau `{ canvas, title }` dans l'ordre du document final.
 */
async function buildPdfPages(itinerary: Itinerary): Promise<Array<{ canvas: HTMLCanvasElement; title: string }>> {
    const sections = collectPdfSections(itinerary);
    const pages: Array<{ canvas: HTMLCanvasElement; title: string }> = [
        {
            canvas: await buildCoverCanvas(itinerary, sections),
            title: "Couverture",
        },
    ];

    if (sections.length === 0) {
        const emptyCanvas = createCanvas(PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
        const ctx = getContext(emptyCanvas);
        ctx.fillStyle = "#FFFDFE";
        ctx.fillRect(0, 0, PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
        drawText(ctx, "Aucun tron\u00e7on d\u00e9taill\u00e9", 88, 120, {
            size: 48,
            weight: 900,
            color: EXPORT_ACCENT_DARK,
        });
        drawParagraph(
            ctx,
            "L'itin\u00e9raire ne contient pas encore de segment assez d\u00e9taill\u00e9 pour g\u00e9n\u00e9rer une page d'aper\u00e7u. Ajoutez des \u00e9tapes avec des coordonn\u00e9es ou chargez un itin\u00e9raire calcul\u00e9.",
            88,
            196,
            1060,
            38,
            {
                size: 26,
                weight: 500,
                color: "#4C3944",
                maxLines: 5,
            },
        );
        pages.push({
            canvas: emptyCanvas,
            title: "Aucun segment",
        });
        return pages;
    }

    for (let index = 0; index < sections.length; index += 1) {
        const section = sections[index];
        pages.push({
            canvas: await buildSectionCanvas(itinerary, section, index, sections.length),
            title: section.title,
        });
    }

    return pages;
}

function downloadBinaryFile(bytes: Uint8Array, fileName: string): void {
    const arrayBuffer = bytes.buffer instanceof ArrayBuffer
        ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        : new Uint8Array(bytes).buffer;
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
}

function buildPdfBytes(pageImages: Array<{ bytes: Uint8Array; width: number; height: number }>): Uint8Array {
    const writer = new SimplePdfWriter();
    const catalogId = 1;
    const pagesId = 2;

    const pageRecords = pageImages.map((pageImage, index) => {
        const imageId = 3 + index * 3;
        const contentId = imageId + 1;
        const pageId = imageId + 2;
        return {
            imageId,
            contentId,
            pageId,
            pageImage,
        };
    });

    writer.setObject(catalogId, bytesFromAscii(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`));
    const kids = pageRecords.map((record) => `${record.pageId} 0 R`).join(" ");
    writer.setObject(pagesId, bytesFromAscii(`<< /Type /Pages /Kids [ ${kids} ] /Count ${pageRecords.length} >>`));

    pageRecords.forEach((record) => {
        writer.setObject(record.imageId, createPdfImageObject(record.pageImage.bytes, record.pageImage.width, record.pageImage.height));
        writer.setObject(record.contentId, createPdfStreamObject(`q ${PDF_PAGE_WIDTH_PT} 0 0 ${PDF_PAGE_HEIGHT_PT} 0 0 cm /Im${record.imageId} Do Q`));
        writer.setObject(
            record.pageId,
            bytesFromAscii(
                `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH_PT} ${PDF_PAGE_HEIGHT_PT}] /Resources << /XObject << /Im${record.imageId} ${record.imageId} 0 R >> >> /Contents ${record.contentId} 0 R >>`,
            ),
        );
    });

    return writer.build();
}

/**
 * Génère puis télécharge un PDF illustré de l'itinéraire courant.
 *
 * Le document est construit côté client : couverture avec carte d'ensemble (tuiles OSM si disponibles),
 * récapitulatif, liste des tronçons, puis une page par segment détaillé avec carte et étapes.
 * Si aucun tronçon n'est exportable, une page d'information supplémentaire est ajoutée après la couverture.
 *
 * @param itinerary — Itinéraire à exporter au format PDF.
 * @remarks Déclenche des requêtes réseau vers les serveurs de tuiles pendant la génération des pages cartographiques.
 */
export async function downloadItineraryPdf(itinerary: Itinerary): Promise<void> {
    const pages = await buildPdfPages(itinerary);
    const pageImages = pages.map((page) => ({
        bytes: canvasToJpegBytes(page.canvas),
        width: page.canvas.width,
        height: page.canvas.height,
    }));

    await nextFrame();

    const pdfBytes = buildPdfBytes(pageImages);
    const fileName = `${sanitizeFileName(itinerary.name)}.pdf`;
    downloadBinaryFile(pdfBytes, fileName);
}

export type { ExportSection };

