/**
 * Fond cartographique pour l'export PDF : assemblage de tuiles OpenStreetMap
 * et projection Web Mercator (repère compatible avec les cartes « slippy map »).
 *
 * @remarks
 * Les tuiles sont chargées dans le navigateur via `fetch`. Respecter la politique
 * d'usage des serveurs de tuiles OSM (volume raisonnable) :
 * {@link https://operations.osmfoundation.org/policies/tiles/}
 */

const TILE_PX = 256;
const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_MAX_TILES = 20;

/** Coordonnées géographiques en degrés décimaux (WGS84). */
export type LatLon = { lat: number; lon: number };

/** Rectangle cible en pixels canvas (origine haut-gauche). */
export type MapRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type WorldBounds = {
    minWx: number;
    maxWx: number;
    minWy: number;
    maxWy: number;
    z: number;
};

function lonLatToWorldPx(lon: number, lat: number, z: number): { wx: number; wy: number } {
    const scale = TILE_PX * 2 ** z;
    const wx = ((lon + 180) / 360) * scale;
    const latRad = (lat * Math.PI) / 180;
    const wy =
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
    return { wx, wy };
}

function expandLonLatBounds(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
    pad: number,
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
    const latSpan = Math.max(maxLat - minLat, 0.00002);
    const lonSpan = Math.max(maxLon - minLon, 0.00002);
    return {
        minLat: minLat - latSpan * pad,
        maxLat: maxLat + latSpan * pad,
        minLon: minLon - lonSpan * pad,
        maxLon: maxLon + lonSpan * pad,
    };
}

function worldBoundsForLonLatBox(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
    z: number,
): WorldBounds {
    const corners: Array<{ wx: number; wy: number }> = [
        lonLatToWorldPx(minLon, maxLat, z),
        lonLatToWorldPx(maxLon, maxLat, z),
        lonLatToWorldPx(minLon, minLat, z),
        lonLatToWorldPx(maxLon, minLat, z),
    ];
    const wxs = corners.map((c) => c.wx);
    const wys = corners.map((c) => c.wy);
    return {
        minWx: Math.min(...wxs),
        maxWx: Math.max(...wxs),
        minWy: Math.min(...wys),
        maxWy: Math.max(...wys),
        z,
    };
}

function tileCountForWorldBounds(bounds: WorldBounds): number {
    const tx0 = Math.floor(bounds.minWx / TILE_PX);
    const tx1 = Math.floor(bounds.maxWx / TILE_PX);
    const ty0 = Math.floor(bounds.minWy / TILE_PX);
    const ty1 = Math.floor(bounds.maxWy / TILE_PX);
    return (tx1 - tx0 + 1) * (ty1 - ty0 + 1);
}

function chooseZoomForBounds(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
    maxTiles: number,
): WorldBounds {
    for (let z = 18; z >= 2; z -= 1) {
        const wb = worldBoundsForLonLatBox(minLat, maxLat, minLon, maxLon, z);
        const n = tileCountForWorldBounds(wb);
        if (n > 0 && n <= maxTiles) {
            return wb;
        }
    }
    return worldBoundsForLonLatBox(minLat, maxLat, minLon, maxLon, 2);
}

async function loadTileImage(z: number, x: number, y: number): Promise<CanvasImageSource | null> {
    const url = OSM_TILE_URL.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        const blob = await response.blob();
        return await createImageBitmap(blob);
    } catch {
        return null;
    }
}

function flattenRoutePoints(routes: LatLon[][]): LatLon[] {
    const out: LatLon[] = [];
    routes.forEach((r) => {
        r.forEach((p) => {
            if (Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
                out.push(p);
            }
        });
    });
    return out;
}

function boundsFromRoutes(routes: LatLon[][]): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
} | null {
    const pts = flattenRoutePoints(routes);
    if (pts.length === 0) {
        return null;
    }
    const lats = pts.map((p) => p.lat);
    const lons = pts.map((p) => p.lon);
    return {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLon: Math.min(...lons),
        maxLon: Math.max(...lons),
    };
}

/**
 * Résultat du rendu tuilé : projecteur cohérent avec l'image dessinée et indicateur de succès.
 *
 * @property project — Fonction lat/lon → pixel canvas dans le même repère que la zone intérieure dessinée.
 * @property drawn — `true` si au moins une tuile a été composée ; sinon le fond carte n'a pas été tracé.
 */
export type OsmProjector = {
    project: (p: LatLon) => { x: number; y: number };
    drawn: boolean;
};

/**
 * Compose un fond carte OSM dans `ctx`, à l'intérieur de `rect`, puis fournit un projecteur
 * Mercator aligné sur la zone réellement dessinée (marges `padding` comprises).
 *
 * Choisit automatiquement un niveau de zoom `z` pour que le nombre de tuiles ne dépasse pas
 * `maxTiles` (évite les requêtes excessives sur de grandes emprises).
 *
 * @param ctx — Contexte 2D du canvas PDF (l'appelant peut avoir appliqué un `clip` arrondi avant l'appel).
 * @param rect — Zone pixel où étirer la vue carte (hors padding interne optionnel via `options.padding`).
 * @param routes — Polylignes WGS84 ; sert uniquement au calcul d'emprise et de zoom (pas de tracé vectoriel ici).
 * @param options.padding — Fraction de `rect` réservée en marge intérieure (défaut `0.08`).
 * @param options.maxTiles — Plafond de tuiles `256×256` à télécharger (défaut 20).
 * @param options.lonLatPad — Expansion relative de la bbox géographique avant choix du zoom (défaut `0.12`).
 * @returns Projecteur et `drawn` ; si aucun point valide ou échec du canvas intermédiaire, `drawn` est `false`
 *          et `project` renvoie le centre de la zone intérieure (comportement neutre pour l'appelant).
 */
export async function drawOsmTilesAndProjector(
    ctx: CanvasRenderingContext2D,
    rect: MapRect,
    routes: LatLon[][],
    options: { padding: number; maxTiles?: number; lonLatPad?: number } = { padding: 0.08 },
): Promise<OsmProjector> {
    const padding = options.padding;
    const maxTiles = options.maxTiles ?? DEFAULT_MAX_TILES;
    const lonLatPad = options.lonLatPad ?? 0.12;

    const innerX = rect.x + rect.width * padding;
    const innerY = rect.y + rect.height * padding;
    const innerW = Math.max(rect.width * (1 - 2 * padding), 1);
    const innerH = Math.max(rect.height * (1 - 2 * padding), 1);

    const noopProject = (p: LatLon): { x: number; y: number } => {
        void p;
        return { x: innerX + innerW / 2, y: innerY + innerH / 2 };
    };

    const rawBounds = boundsFromRoutes(routes);
    if (!rawBounds) {
        return { project: noopProject, drawn: false };
    }

    const { minLat, maxLat, minLon, maxLon } = expandLonLatBounds(
        rawBounds.minLat,
        rawBounds.maxLat,
        rawBounds.minLon,
        rawBounds.maxLon,
        lonLatPad,
    );

    const world = chooseZoomForBounds(minLat, maxLat, minLon, maxLon, maxTiles);
    const { minWx, maxWx, minWy, maxWy, z } = world;

    const tx0 = Math.floor(minWx / TILE_PX);
    const tx1 = Math.floor(maxWx / TILE_PX);
    const ty0 = Math.floor(minWy / TILE_PX);
    const ty1 = Math.floor(maxWy / TILE_PX);

    const gridW = (tx1 - tx0 + 1) * TILE_PX;
    const gridH = (ty1 - ty0 + 1) * TILE_PX;
    const stitched = document.createElement("canvas");
    stitched.width = gridW;
    stitched.height = gridH;
    const sctx = stitched.getContext("2d");
    if (!sctx) {
        return { project: noopProject, drawn: false };
    }

    const promises: Promise<void>[] = [];
    for (let tx = tx0; tx <= tx1; tx += 1) {
        for (let ty = ty0; ty <= ty1; ty += 1) {
            const px = (tx - tx0) * TILE_PX;
            const py = (ty - ty0) * TILE_PX;
            promises.push(
                (async () => {
                    const img = await loadTileImage(z, tx, ty);
                    if (img) {
                        sctx.drawImage(img, px, py, TILE_PX, TILE_PX);
                    } else {
                        sctx.fillStyle = "#E8E4E6";
                        sctx.fillRect(px, py, TILE_PX, TILE_PX);
                    }
                })(),
            );
        }
    }
    await Promise.all(promises);

    const srcX = minWx - tx0 * TILE_PX;
    const srcY = minWy - ty0 * TILE_PX;
    const srcW = Math.max(maxWx - minWx, 1);
    const srcH = Math.max(maxWy - minWy, 1);

    ctx.drawImage(stitched, srcX, srcY, srcW, srcH, innerX, innerY, innerW, innerH);

    const project = (p: LatLon): { x: number; y: number } => {
        const { wx, wy } = lonLatToWorldPx(p.lon, p.lat, z);
        const u = (wx - minWx) / srcW;
        const v = (wy - minWy) / srcH;
        return {
            x: innerX + u * innerW,
            y: innerY + v * innerH,
        };
    };

    return { project, drawn: true };
}
