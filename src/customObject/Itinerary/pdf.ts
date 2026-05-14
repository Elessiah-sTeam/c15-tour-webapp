import type { Itinerary, Segment } from "./types.ts";
import { extractLineStringCoordinates } from "./gpx.ts";
import { sanitizeFileName } from "./fileName.ts";

const PAGE_CANVAS_WIDTH = 1240;
const PAGE_CANVAS_HEIGHT = 1754;
const PDF_PAGE_WIDTH_PT = 595.28;
const PDF_PAGE_HEIGHT_PT = 841.89;
const EXPORT_ACCENT = "#BB487C";
const EXPORT_ACCENT_DARK = "#7B1D57";
const EXPORT_PANEL = "rgba(255, 255, 255, 0.82)";
const EXPORT_PANEL_BORDER = "rgba(187, 72, 124, 0.18)";

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

    if (distanceKm >= 10) {
        return `${distanceKm.toFixed(0)} km`;
    }

    return `${distanceKm.toFixed(1)} km`;
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
    options: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; maxWidth?: number } = {},
): void {
    ctx.save();
    ctx.fillStyle = options.color ?? "#2E2430";
    ctx.font = `${options.weight ?? 600} ${options.size ?? 28}px "Montserrat", "Segoe UI", sans-serif`;
    ctx.textAlign = options.align ?? "left";
    ctx.textBaseline = "top";
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

function toCanvasPoint(point: { lat: number; lon: number }, bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }, box: { x: number; y: number; width: number; height: number; padding: number }): { x: number; y: number } {
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

function drawRouteSnapshot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    routePoints: RoutePoint[],
    title: string,
): void {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#FFFDFD");
    gradient.addColorStop(1, "#F8EEF5");

    roundRect(ctx, x, y, width, height, 30);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.save();
    roundRect(ctx, x, y, width, height, 30);
    ctx.clip();

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

    if (routePoints.length >= 2) {
        const latitudes = routePoints.map((point) => point.lat);
        const longitudes = routePoints.map((point) => point.lon);
        const latSpan = Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.01);
        const lonSpan = Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.01);
        const bounds = {
            minLat: Math.min(...latitudes) - latSpan * 0.12,
            maxLat: Math.max(...latitudes) + latSpan * 0.12,
            minLon: Math.min(...longitudes) - lonSpan * 0.12,
            maxLon: Math.max(...longitudes) + lonSpan * 0.12,
        };

        const mappedPoints = routePoints.map((point) => toCanvasPoint(point, bounds, {
            x,
            y,
            width,
            height,
            padding: 0.08,
        }));

        ctx.save();
        ctx.strokeStyle = "rgba(125, 29, 87, 0.15)";
        ctx.lineWidth = 18;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        mappedPoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = EXPORT_ACCENT;
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        mappedPoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        ctx.restore();

        const drawMarker = (point: { x: number; y: number }, color: string, label?: string, innerColor = "#FFFFFF"): void => {
            ctx.save();
            ctx.font = '700 18px "Montserrat", "Segoe UI", sans-serif';
            const labelWidth = label ? Math.min(ctx.measureText(label).width + 30, 320) : 120;
            ctx.restore();

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

            if (label) {
                const bubbleWidth = Math.max(labelWidth, 120);
                const bubbleHeight = 44;
                const bubbleX = Math.min(Math.max(point.x + 24, x + 18), x + width - bubbleWidth - 18);
                const bubbleY = Math.max(point.y - 22, y + 18);

                ctx.save();
                ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
                ctx.strokeStyle = "rgba(187, 72, 124, 0.20)";
                ctx.lineWidth = 2;
                roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 18);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                drawText(ctx, fitText(ctx, label, bubbleWidth - 28), bubbleX + 14, bubbleY + 10, {
                    size: 18,
                    weight: 700,
                    color: "#5E2142",
                });
            }
        };

        const firstLabel = routePoints[0].label;
        const lastLabel = routePoints[routePoints.length - 1].label;

        mappedPoints.forEach((point, index) => {
            if (index === 0) {
                drawMarker(point, "#16A34A", firstLabel ?? "Départ");
            } else if (index === mappedPoints.length - 1) {
                drawMarker(point, "#E11D48", lastLabel ?? "Arrivée");
            } else {
                ctx.save();
                ctx.fillStyle = EXPORT_ACCENT;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
        ctx.strokeStyle = "rgba(187, 72, 124, 0.18)";
        ctx.lineWidth = 2;
        roundRect(ctx, x + 24, y + 24, 250, 64, 18);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(ctx, "Capture du trajet", x + 44, y + 41, {
            size: 22,
            weight: 800,
            color: EXPORT_ACCENT_DARK,
        });
        drawText(ctx, title, x + 44, y + 68, {
            size: 16,
            weight: 500,
            color: "#67425B",
            maxWidth: 190,
        });
    } else {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.80)";
        ctx.strokeStyle = "rgba(187, 72, 124, 0.20)";
        ctx.lineWidth = 2;
        roundRect(ctx, x + 42, y + height / 2 - 60, width - 84, 120, 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawText(ctx, "Aucun trajet détaillé", x + width / 2, y + height / 2 - 10, {
            size: 30,
            weight: 800,
            color: EXPORT_ACCENT_DARK,
            align: "center",
        });
        drawText(ctx, "Ajoutez des points de passage pour générer un aperçu visuel.", x + width / 2, y + height / 2 + 36, {
            size: 18,
            weight: 500,
            color: "#6B5563",
            align: "center",
        });
    }

    ctx.restore();
}

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
                label: firstStep?.content.title?.trim() || "Départ",
            };
            geometryPoints[geometryPoints.length - 1] = {
                ...geometryPoints[geometryPoints.length - 1],
                label: lastStep?.content.title?.trim() || "Arrivée",
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
                    ? `${segment.steps.length} étape${segment.steps.length > 1 ? "s" : ""}`
                    : "Sans étape",
                durationLabel: formatDuration(segment.content.duration.duration),
                distanceLabel: formatDistance(segment.content.distance),
                departureLabel: formatDateTime(segment.content.hour),
                stepTitles,
                routePoints: collectRoutePoints(segment),
            };
        });
}

function buildCoverCanvas(itinerary: Itinerary, sections: ExportSection[]): HTMLCanvasElement {
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

    drawText(ctx, "Export PDF de l'itinéraire", 88, 146, {
        size: 58,
        weight: 900,
        color: EXPORT_ACCENT_DARK,
    });

    const title = itinerary.name.trim() || "Itinéraire sans nom";
    drawParagraph(ctx, title, 88, 226, PAGE_CANVAS_WIDTH * 0.62, 56, {
        size: 42,
        weight: 700,
        color: "#2E2430",
        maxLines: 2,
    });

    drawText(ctx, "Vue d'ensemble", 88, 390, {
        size: 22,
        weight: 800,
        color: EXPORT_ACCENT,
    });

    drawShadowedPanel(ctx, 84, 438, 1072, 212, 30, EXPORT_PANEL);
    const summaryCards = [
        {
            label: "Segments détaillés",
            value: `${sections.length}`,
        },
        {
            label: "Distance totale",
            value: formatDistance(itinerary.totalDistance),
        },
        {
            label: "Durée totale",
            value: formatDuration(itinerary.totalDuration.duration),
        },
        {
            label: "Généré le",
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
        const cardY = 486;

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

    drawShadowedPanel(ctx, 84, 696, 1072, 744, 34, "rgba(255, 255, 255, 0.88)");
    drawText(ctx, "Tronçons exportés", 118, 734, {
        size: 24,
        weight: 800,
        color: EXPORT_ACCENT_DARK,
    });
    drawText(ctx, "Un aperçu détaillé sera généré pour chaque segment.", 118, 768, {
        size: 18,
        weight: 500,
        color: "#6B5563",
    });

    if (sections.length === 0) {
        drawText(ctx, "Aucun segment détaillé n'a été trouvé.", 118, 836, {
            size: 30,
            weight: 800,
            color: EXPORT_ACCENT,
        });
        drawParagraph(
            ctx,
            "Ajoutez des points de passage et des tronçons calculés pour obtenir un PDF illustré avec un aperçu du trajet.",
            118,
            888,
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
        sections.slice(0, 8).forEach((section, index) => {
            const rowY = 832 + index * 80;
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

            drawText(ctx, `${index + 1}`, 140, rowY + 20, {
                size: 18,
                weight: 900,
                color: "#FFFFFF",
                align: "center",
            });
            drawText(ctx, section.title, 174, rowY + 14, {
                size: 20,
                weight: 800,
                color: "#2E2430",
            });
            drawText(ctx, section.subtitle, 740, rowY + 18, {
                size: 17,
                weight: 700,
                color: "#6A4960",
                align: "right",
                maxWidth: 334,
            });
        });
    }

    return canvas;
}

function buildSectionCanvas(
    itinerary: Itinerary,
    section: ExportSection,
    index: number,
    total: number,
): HTMLCanvasElement {
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

    drawText(ctx, itinerary.name.trim() || "Itinéraire sans nom", 88, 68, {
        size: 24,
        weight: 900,
        color: EXPORT_ACCENT,
    });
    drawText(ctx, `Tronçon ${index + 1} / ${total}`, 88, 116, {
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

    drawShadowedPanel(ctx, 84, 270, 1072, 782, 34, EXPORT_PANEL);
    drawRouteSnapshot(ctx, 120, 314, 1000, 454, section.routePoints, section.title);

    drawShadowedPanel(ctx, 84, 1088, 1072, 540, 32, "rgba(255, 255, 255, 0.92)");
    drawText(ctx, "Détails du tronçon", 118, 1128, {
        size: 24,
        weight: 800,
        color: EXPORT_ACCENT_DARK,
    });

    const detailColumns = [
        { label: "Départ estimé", value: section.departureLabel },
        { label: "Distance", value: section.distanceLabel },
        { label: "Durée", value: section.durationLabel },
        { label: "Étapes", value: section.subtitle },
    ];

    detailColumns.forEach((column, columnIndex) => {
        const columnWidth = 230;
        const gap = 20;
        const columnX = 118 + columnIndex * (columnWidth + gap);
        const columnY = 1172;

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

    drawText(ctx, "Étapes et arrêts", 118, 1320, {
        size: 22,
        weight: 800,
        color: EXPORT_ACCENT,
    });

    if (section.stepTitles.length === 0) {
        drawParagraph(ctx, "Aucune étape textuelle n'a été renseignée sur ce tronçon.", 118, 1360, 980, 30, {
            size: 20,
            weight: 500,
            color: "#54414C",
            maxLines: 4,
        });
    } else {
        section.stepTitles.slice(0, 7).forEach((stepTitle, stepIndex) => {
            const rowY = 1360 + stepIndex * 46;
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

async function buildPdfPages(itinerary: Itinerary): Promise<Array<{ canvas: HTMLCanvasElement; title: string }>> {
    const sections = collectPdfSections(itinerary);
    const pages: Array<{ canvas: HTMLCanvasElement; title: string }> = [
        {
            canvas: buildCoverCanvas(itinerary, sections),
            title: "Couverture",
        },
    ];

    if (sections.length === 0) {
        const emptyCanvas = createCanvas(PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
        const ctx = getContext(emptyCanvas);
        ctx.fillStyle = "#FFFDFE";
        ctx.fillRect(0, 0, PAGE_CANVAS_WIDTH, PAGE_CANVAS_HEIGHT);
        drawText(ctx, "Aucun tronçon détaillé", 88, 120, {
            size: 48,
            weight: 900,
            color: EXPORT_ACCENT_DARK,
        });
        drawParagraph(
            ctx,
            "L'itinéraire ne contient pas encore de segment assez détaillé pour générer une page d'aperçu. Ajoutez des étapes avec des coordonnées ou chargez un itinéraire calculé.",
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

    sections.forEach((section, index) => {
        pages.push({
            canvas: buildSectionCanvas(itinerary, section, index, sections.length),
            title: section.title,
        });
    });

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
