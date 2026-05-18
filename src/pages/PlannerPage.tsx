import { useState } from "react";
import type { LatLngExpression } from "leaflet";
import { useNavigate } from "react-router-dom";
import BackgroundMap from "../components/Map/BackgroundMap.tsx";
import Panels from "../components/Panels/Panels.tsx";
import SearchBar from "../components/Search/SearchBar.tsx";
import "../App.css";
import IdRoutingManager from "../components/IdRoutingManager.tsx";
import { saveStateStore } from "../customObject/SaveState/SaveStateStore.ts";
import { itineraryModel } from "../customObject/Itinerary/ItineraryStore.ts";
import { getAuthToken } from "../auth/useAuth.ts";

const BACKEND_URL = "http://localhost:8080";

function authHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export default function PlannerPage() {
    const navigate = useNavigate();
    const [searchPosition, setSearchPosition] = useState<LatLngExpression | null>(null);
    const [searchLabel, setSearchLabel] = useState("");
    const [panelOpen, setPanelOpen] = useState(true);
    const [showGuard, setShowGuard] = useState(false);
    const [guardLoading, setGuardLoading] = useState(false);

    const handleGoHome = () => {
        if (saveStateStore.getSnapshot()) {
            setShowGuard(true);
        } else {
            navigate("/");
        }
    };

    const handleSaveAsDraftAndLeave = async () => {
        setGuardLoading(true);
        await itineraryModel.netModel.saveAsDraft();
        setGuardLoading(false);
        setShowGuard(false);
        navigate("/");
    };

    const handleSaveAsFinalizedAndLeave = async () => {
        setGuardLoading(true);
        await itineraryModel.netModel.saveAsFinalized();
        setGuardLoading(false);
        setShowGuard(false);
        navigate("/");
    };

    const handleDeleteAndLeave = async () => {
        setGuardLoading(true);
        const currentId = itineraryModel.route.id;
        if (currentId !== -1) {
            try {
                await fetch(`${BACKEND_URL}/tours/${currentId}`, {
                    method: "DELETE",
                    headers: authHeaders(),
                });
            } catch {
                // ignore — navigate anyway
            }
        }
        itineraryModel.reset();
        saveStateStore.set(() => false);
        setGuardLoading(false);
        setShowGuard(false);
        navigate("/");
    };

    return (
        <div className="window">
            <IdRoutingManager />
            <button
                className="home-return"
                type="button"
                onClick={handleGoHome}
            >
                ↩ Accueil
            </button>

            <BackgroundMap searchPosition={searchPosition} searchLabel={searchLabel}>
                <div className="search-panel">
                    <SearchBar
                        onLocationSelected={(coords, label) => {
                            setSearchPosition(coords);
                            setSearchLabel(label);
                        }}
                    />
                </div>
            </BackgroundMap>

            {panelOpen ? (
                <div className="panel">
                    <Panels onClose={() => setPanelOpen(false)} />
                </div>
            ) : (
                <button
                    className="panel-toggle"
                    aria-label="Ouvrir le panneau"
                    onClick={() => setPanelOpen(true)}
                >
                    &#9776;
                </button>
            )}

            {showGuard && (
                <div className="guard-overlay" role="dialog" aria-modal="true">
                    <div className="guard-modal">
                        <div className="guard-header">
                            <h3 className="guard-title">Quitter sans enregistrer ?</h3>
                            <button
                                className="guard-close"
                                onClick={() => setShowGuard(false)}
                                aria-label="Annuler"
                                disabled={guardLoading}
                            >
                                ✕
                            </button>
                        </div>
                        <p className="guard-body">
                            Ce convoi a des modifications non sauvegardées. Que souhaitez-vous faire ?
                        </p>
                        <div className="guard-actions">
                            <button
                                className="guard-btn guard-btn-draft"
                                onClick={handleSaveAsDraftAndLeave}
                                disabled={guardLoading}
                            >
                                Enregistrer en brouillon
                            </button>
                            <button
                                className="guard-btn guard-btn-save"
                                onClick={handleSaveAsFinalizedAndLeave}
                                disabled={guardLoading}
                            >
                                Enregistrer le convoi
                            </button>
                            <button
                                className="guard-btn guard-btn-delete"
                                onClick={handleDeleteAndLeave}
                                disabled={guardLoading}
                            >
                                Supprimer le convoi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
