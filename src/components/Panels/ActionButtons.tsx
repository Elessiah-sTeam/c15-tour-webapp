import { useState } from "react";
import { Trash, Pencil, Settings, Share2, Download, FileDown } from "lucide-react";
import "./Panels.css";
import useOutsideClick from "../useOutsideClick.ts";
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
import { useIsDirty } from "../../customObject/SaveState/useIsDirty.ts";
import {
    buildSegmentDurationErrorMessage,
    findSegmentDurationViolations,
} from "../../customObject/Itinerary/segmentDurationValidation.ts";

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

/**
 * Barre d'actions de l'itinéraire (paramètres, suppression, partage, export, sauvegarde).
 * L'export GPX et PDF est regroupé derrière un unique bouton « Exporter » qui ouvre
 * un menu de choix du format.
 */
export default function ActionButtons() {
    const delMod = useDeleteMod(deleteModStore);
    const itinerary = useItinerary(itineraryModel.store);
    const isDirty = useIsDirty();
    const [showSettings, setShowSettings] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const exportRef = useOutsideClick<HTMLDivElement>(() => setShowExport(false));
    const [currentSettings, setCurrentSettings] = useState<GlobalSettings | undefined>(undefined);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
    const exportLabel = "Exporter l'itin\u00e9raire";
    const canExport = canDownloadGpx || canExportPdf;

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

        itineraryModel.applySegmentPauseConfigs(settings.pauseConfigs);
    };

    const hasValidSegmentDurations = (): boolean => {
        const settings = loadGlobalSettings(itinerary);
        const violations = findSegmentDurationViolations(itinerary, settings);
        if (violations.length > 0) {
            pushErrorToast(buildSegmentDurationErrorMessage(violations, settings));
            return false;
        }
        return true;
    };

    const handleSaveAsDraft = async () => {
        if (!hasValidSegmentDurations()) {
            return;
        }
        setIsSaving(true);
        await itineraryModel.netModel.saveAsDraft();
        setIsSaving(false);
    };

    const handleSaveAsFinalized = async () => {
        if (!hasValidSegmentDurations()) {
            return;
        }
        setIsSaving(true);
        await itineraryModel.netModel.saveAsFinalized();
        setIsSaving(false);
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

    const handleDownloadGpx = () => {
        setShowExport(false);
        downloadGpx(itinerary.name, itinerary.segments.map((segment) => ({
            geometry: segment.content.geometry,
        })));
    };

    const handleSelectPdfExport = async () => {
        setShowExport(false);
        await handleExportPdf();
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
                <div className={"export-menu-wrapper"} ref={exportRef}>
                    <button
                        className={"export-btn"}
                        aria-label={exportLabel}
                        title={exportLabel}
                        aria-haspopup={"menu"}
                        aria-expanded={showExport}
                        onClick={() => setShowExport((prev) => !prev)}
                        disabled={!canExport || isExportingPdf}
                    >
                        <Download color={canExport && !isExportingPdf ? "#BB487C" : "#ccc"} />
                    </button>
                    {showExport && (
                        <div className={"export-menu"} role={"menu"}>
                            <button
                                type={"button"}
                                className={"export-menu-item"}
                                role={"menuitem"}
                                onClick={handleDownloadGpx}
                                disabled={!canDownloadGpx}
                            >
                                <Download size={16} />
                                {downloadLabel}
                            </button>
                            <button
                                type={"button"}
                                className={"export-menu-item"}
                                role={"menuitem"}
                                onClick={handleSelectPdfExport}
                                disabled={isExportingPdf || !canExportPdf}
                            >
                                <FileDown size={16} />
                                {pdfLabel}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="save-buttons">
                <button
                    className={`save-btn save-btn-draft${isDirty ? " dirty" : ""}`}
                    onClick={handleSaveAsDraft}
                    disabled={isSaving}
                    title="Enregistrer en brouillon"
                >
                    Brouillon
                </button>
                <button
                    className={`save-btn save-btn-finalize${isDirty ? " dirty" : ""}`}
                    onClick={handleSaveAsFinalized}
                    disabled={isSaving}
                    title="Enregistrer le convoi"
                >
                    Enregistrer
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
