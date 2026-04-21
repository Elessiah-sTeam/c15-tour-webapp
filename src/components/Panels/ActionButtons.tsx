import { useState } from "react";
import { Trash, Pencil, Settings, Upload } from "lucide-react";
import './Panels.css';
import { deleteModStore } from "../../customObject/DeleteMod/DeleteModStore.ts";
import { useDeleteMod } from "../../customObject/DeleteMod/useDeleteMod.ts";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import {
    DEFAULT_ROUTE_SETTINGS,
    formatLocalDate,
    formatLocalTime,
    getStoredSettings,
    saveStoredSettings
} from "../../customObject/Itinerary/routeSettings.ts";
import { SettingsModal, type GlobalSettings, type PauseConfig } from "../SettingsModal/SettingsModal";

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
    const [currentSettings, setCurrentSettings] = useState<GlobalSettings | undefined>(undefined);

    const handleOpenSettings = () => {

        const isNewEmptyConvoy = itinerary.id === -1 &&
            itinerary.segments.filter(s => !s.isStartEnd).length === 0;

        const currentDeparture = itinerary.segments[0]?.content.hour ?? new Date();
        const storedSettings = isNewEmptyConvoy ? {} : getStoredSettings(itinerary.id);
        const baseSettings: GlobalSettings = {
            convoyName: itinerary.name || storedSettings.convoyName || 'Mon convoi',
            departureDate: storedSettings.departureDate || formatLocalDate(currentDeparture),
            departureTime: storedSettings.departureTime || formatLocalTime(currentDeparture),
            speedPercentage: storedSettings.speedPercentage ?? DEFAULT_ROUTE_SETTINGS.speedPercentage,
            minSegmentDuration: storedSettings.minSegmentDuration ?? DEFAULT_ROUTE_SETTINGS.minSegmentDuration,
            maxSegmentDuration: storedSettings.maxSegmentDuration ?? DEFAULT_ROUTE_SETTINGS.maxSegmentDuration,
            pauseConfigs: (storedSettings.pauseConfigs ?? []).map((pause) => ({
                segmentId: pause.segmentId ?? '',
                segmentName: pause.segmentName ?? '',
                duration: pause.duration ?? 30
            }))
        };

        const pauseConfigs: PauseConfig[] = itinerary.segments
            .filter(seg => !seg.isStartEnd && seg.id !== 'start' && seg.id !== 'end')
            .map(seg => {
                const existingPause = baseSettings.pauseConfigs.find((pause) =>
                    pause.segmentId === seg.id || pause.segmentName === seg.content.title
                );
                return {
                    segmentId: seg.id,
                    segmentName: seg.content.title || 'Segment sans nom',
                    duration: existingPause?.duration || 30
                };
            });

        setCurrentSettings({
            ...baseSettings,
            convoyName: itinerary.name || baseSettings.convoyName || 'Mon convoi',
            pauseConfigs
        });

        setShowSettings(true);
    };

    const handleSaveSettings = async(settings: GlobalSettings) => {
        saveStoredSettings(itinerary.id, settings);

        // Synchroniser le nom du convoi avec itineraryModel
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
                    className={"export-btn"}
                    aria-label={"Export"}
                    onClick={async() => {await itineraryModel.netModel.put()}}
                >
                    <Upload color={"#BB487C"}/>
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
        </>
    );
}
