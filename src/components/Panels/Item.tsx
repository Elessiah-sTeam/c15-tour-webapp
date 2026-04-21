import "./Panels.css";
import * as React from "react";
import { TimeSpan } from "../../customObject/TimeSpan.ts";
import { useDeleteMod } from "../../customObject/DeleteMod/useDeleteMod.ts";
import { deleteModStore } from "../../customObject/DeleteMod/DeleteModStore.ts";
import { Pencil, Trash } from "lucide-react";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import ItemActionModal from "./ItemActionModal.tsx";
import {
    getSegmentPauseDuration,
    removeSegmentPauseConfig,
    upsertSegmentPauseConfig
} from "../SettingsModal/settingsStorage.ts";

type Props = {
    duration?: TimeSpan;
    hour?: Date;
    isStartEnd: boolean;
    children: React.ReactNode;
    categoryId: string;
    itemId?: string;
    isDefault: boolean;
    title: string;
}

function formatPanelDuration(duration?: TimeSpan): string {
    const normalizedDuration = Object.assign(new TimeSpan(), duration);
    const composed = normalizedDuration.getTimeSpanComposed();
    const totalHours = (composed.days * 24) + composed.hours;

    return `${totalHours}h${String(composed.minutes).padStart(2, "0")}`;
}

/**
 * Composant qui englobe le titre et contient l'heure et la durée
 * @param duration durée à afficher
 * @param hour heure à afficher
 * @param isStartEnd indique si c'est un départ ou une arrivée
 * @param children Composant englobé
 * @param categoryId ID de la catégorie concerné
 * @param itemId ID de l'item concerné
 * @param isDefault Est-ce que c'est départ par défaut. Donc est-il DND
 * @param title libellé actuel de la ligne
 */
export default function Item({
    duration,
    hour,
    isStartEnd,
    children,
    categoryId,
    itemId,
    isDefault,
    title
}: Props) {
    const delMod = useDeleteMod(deleteModStore);
    const [showActionModal, setShowActionModal] = React.useState(false);
    const [pauseDuration, setPauseDuration] = React.useState<number>(30);
    duration = Object.assign(new TimeSpan(), duration);

    /**
     * Gère la suppression de l'étape ou du segment
     */
    function handleDelete() {
        const itinerary = itineraryModel.route;

        if (itemId != null) {
            itineraryModel.removeStep(categoryId, itemId);
            return;
        }

        removeSegmentPauseConfig(itinerary, categoryId);
        itineraryModel.removeSegment(categoryId);
    }

    function handleOpenActions(event: React.MouseEvent | React.PointerEvent) {
        event.stopPropagation();

        if (itemId == null) {
            setPauseDuration(getSegmentPauseDuration(itineraryModel.route, categoryId));
        }

        setShowActionModal(true);
    }

    function handleSave(name: string, nextPauseDuration?: number) {
        if (itemId != null) {
            itineraryModel.renameStep(categoryId, itemId, name);
            return;
        }

        itineraryModel.renameSegment(categoryId, name);

        if (nextPauseDuration != null) {
            const normalizedPause = Math.max(0, Math.min(120, nextPauseDuration));
            setPauseDuration(normalizedPause);
            upsertSegmentPauseConfig(itineraryModel.route, categoryId, name, normalizedPause);
        }
    }

    return (
        <>
            <div className={"item"}>
                <div className={"left-part-item"}>
                    {children}
                </div>
                <div className={"item-trailing"}>
                    {isStartEnd
                        ? <b className={"hour"}>{hour?.getHours()}:{hour?.getMinutes().toString().padStart(2, "0")}</b>
                        : <b className={"hour"}>{formatPanelDuration(duration)}</b>}
                    {isDefault
                        ? <span className={"item-action-placeholder"} aria-hidden={true}></span>
                        : delMod
                            ? (
                                <button
                                    type="button"
                                    className={"item-action-trigger item-action-trigger-delete"}
                                    aria-label={"Supprimer"}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleDelete();
                                    }}
                                >
                                    <Trash className={"reorder-icon"} color={"#BB487C"} />
                                </button>
                            )
                            : (
                                <button
                                    type="button"
                                    className={"item-action-trigger"}
                                    aria-label={"Modifier"}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={handleOpenActions}
                                >
                                    <Pencil className={"reorder-icon"} color={"#BB487C"} />
                                </button>
                            )}
                </div>
            </div>
            <ItemActionModal
                isOpen={showActionModal}
                mode={itemId == null ? "segment" : "step"}
                initialName={title}
                initialPauseDuration={itemId == null ? pauseDuration : undefined}
                onClose={() => setShowActionModal(false)}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </>
    );
}
