import { useState } from "react";
import { Trash, Pencil, Settings, Share2, Download } from "lucide-react";
import './Panels.css';
import { deleteModStore } from "../../customObject/DeleteMod/DeleteModStore.ts";
import { useDeleteMod } from "../../customObject/DeleteMod/useDeleteMod.ts";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import { SettingsModal } from "../SettingsModal/SettingsModal";
import { loadGlobalSettings, persistGlobalSettings } from "../SettingsModal/settingsStorage.ts";
import type { GlobalSettings } from "../SettingsModal/settingsTypes.ts";
import ShareModal from "./ShareModal.tsx";
import { downloadGpx, hasGpxGeometry } from "../../customObject/Itinerary/gpx.ts";

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
    const canDownloadGpx = hasGpxGeometry(itinerary.segments.map((segment) => ({
        geometry: segment.content.geometry,
    })));

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

    return (
        <>
            <div className={"action-buttons"}>
                <button
                    className={"global-settings-btn"}
                    aria-label={"Paramètres globaux"}
                    onClick={handleOpenSettings}
                >
                    <Settings color={"#BB487C"}/>
                </button>
                <button
                    className={"delete-btn"}
                    aria-label={"Supprimer"}
                    onClick={() => {deleteModStore.set(prev => !prev)}}
                >
                    { delMod
                        ?
                        <Pencil color={"#BB487C"}/>
                        :
                        <Trash color={"#BB487C"}/>
                    }
                </button>
                <button
                    className={"share-btn"}
                    aria-label={"Partager"}
                    onClick={() => setShowShare(true)}
                    disabled={!itinerary.shareCode}
                >
                    <Share2 color={itinerary.shareCode ? "#BB487C" : "#ccc"}/>
                </button>
                <button
                    className={"download-gpx-btn"}
                    aria-label={"Telecharger le GPX"}
                    title={"Telecharger le GPX"}
                    onClick={() => downloadGpx(itinerary.name, itinerary.segments.map((segment) => ({
                        geometry: segment.content.geometry,
                    })))}
                    disabled={!canDownloadGpx}
                >
                    <Download color={canDownloadGpx ? "#BB487C" : "#ccc"}/>
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
