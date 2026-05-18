import { useState } from "react";
import { Trash, Pencil, Settings, Share2, Download, FileDown } from "lucide-react";
import "./Panels.css";
import { deleteModStore } from "../../customObject/DeleteMod/DeleteModStore.ts";
import { useDeleteMod } from "../../customObject/DeleteMod/useDeleteMod.ts";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import { SettingsModal } from "../SettingsModal/SettingsModal";
import { loadGlobalSettings, persistGlobalSettings } from "../SettingsModal/settingsStorage.ts";
import type { GlobalSettings } from "../SettingsModal/settingsTypes.ts";
import ShareModal from "./ShareModal.tsx";
import { downloadGpx, hasGpxGeometry } from "../../customObject/Itinerary/gpx.ts";
import { downloadItineraryPdf, collectPdfSections } from "../../customObject/Itinerary/pdf.ts";
import { pushErrorToast } from "../../customObject/Toast/ToastStore.ts";

function buildDepartureDateTime(departureDate: string, departureTime: string): Date | null {
    if (!departureDate || !departureTime) {
        return null;
    }

    const [year, month, day] = departureDate.split("-").map(Number);
    const [hours, minutes] = departureTime.split(":").map(Number);

    if ([year, month, day, hours, minutes].some(Number.isNaN)) {
        return null;
    }

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export default function ActionButtons() {
    const delMod = useDeleteMod(deleteModStore);
    const itinerary = useItinerary(itineraryModel.store);
    const [showSettings, setShowSettings] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [currentSettings, setCurrentSettings] = useState<GlobalSettings | undefined>(undefined);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const canDownloadGpx = hasGpxGeometry(itinerary.segments.map((segment) => ({
        geometry: segment.content.geometry,
    })));
    const canExportPdf = collectPdfSections(itinerary).length > 0 || itinerary.segments.length > 0;
    const settingsLabel = "Param\u00e8tres globaux";
    const deleteModeLabel = delMod
        ? "Quitter le mode suppression"
        : "Activer le mode suppression";
    const shareLabel = itinerary.shareCode
        ? "Partager"
        : "Partage indisponible";
    const downloadLabel = canDownloadGpx
        ? "T\u00e9l\u00e9charger le GPX"
        : "T\u00e9l\u00e9chargement GPX indisponible";
    const pdfLabel = isExportingPdf
        ? "G\u00e9n\u00e9ration du PDF..."
        : "Exporter en PDF";

    const handleOpenSettings = () => {
        setCurrentSettings(loadGlobalSettings(itinerary));
        setShowSettings(true);
    };

    const handleSaveSettings = async(settings: GlobalSettings) => {
        persistGlobalSettings(itinerary.id, settings);

        if (settings.convoyName && settings.convoyName !== itinerary.name) {
            itineraryModel.renameItinerary(settings.convoyName);
        }

        const departureDateTime = buildDepartureDateTime(settings.departureDate, settings.departureTime);
        if (departureDateTime) {
            await itineraryModel.setDepartureDateTime(departureDateTime);
        }
    };

    /**
     * Lance l'export PDF en empêchant les doubles clics pendant la génération.
     */
    const handleExportPdf = async () => {
        try {
            setIsExportingPdf(true);
            await downloadItineraryPdf(itinerary);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            pushErrorToast(`Erreur lors de l'export PDF : ${detail}`);
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <>
            <div className={"action-buttons"}>
                <button
                    className={"global-settings-btn"}
                    aria-label={settingsLabel}
                    title={settingsLabel}
                    onClick={handleOpenSettings}
                >
                    <Settings color={"#BB487C"} />
                </button>
                <button
                    className={"delete-btn"}
                    aria-label={deleteModeLabel}
                    title={deleteModeLabel}
                    onClick={() => { deleteModStore.set(prev => !prev); }}
                >
                    {delMod
                        ? <Pencil color={"#BB487C"} />
                        : <Trash color={"#BB487C"} />
                    }
                </button>
                <button
                    className={"share-btn"}
                    aria-label={shareLabel}
                    title={shareLabel}
                    onClick={() => setShowShare(true)}
                    disabled={!itinerary.shareCode}
                >
                    <Share2 color={itinerary.shareCode ? "#BB487C" : "#ccc"} />
                </button>
                <button
                    className={"download-gpx-btn"}
                    aria-label={downloadLabel}
                    title={downloadLabel}
                    onClick={() => downloadGpx(itinerary.name, itinerary.segments.map((segment) => ({
                        geometry: segment.content.geometry,
                    })))}
                    disabled={!canDownloadGpx}
                >
                    <Download color={canDownloadGpx ? "#BB487C" : "#ccc"} />
                </button>
                <button
                    className={"download-pdf-btn"}
                    aria-label={pdfLabel}
                    title={pdfLabel}
                    onClick={handleExportPdf}
                    disabled={isExportingPdf || !canExportPdf}
                >
                    <FileDown color={isExportingPdf ? "#ccc" : "#BB487C"} />
                </button>
            </div>

            {showSettings && (
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onSave={handleSaveSettings}
                    initialSettings={currentSettings}
                />
            )}

            {showShare && itinerary.shareCode && (
                <ShareModal
                    shareCode={itinerary.shareCode}
                    onClose={() => setShowShare(false)}
                />
            )}
        </>
    );
}
