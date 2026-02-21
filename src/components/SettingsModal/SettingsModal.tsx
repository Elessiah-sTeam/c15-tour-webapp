import { useState } from 'react';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: GlobalSettings) => void;
    initialSettings?: GlobalSettings;
}

export interface GlobalSettings {
    convoyName: string;
    departureDate: string;
    departureTime: string;

    // Préférences de route
    routeType: 'fastest' | 'shortest' | 'balanced';
    averageSpeed: number;
    breakInterval: number;

    // Gestion des pauses
    breakDuration: number;
    breakType: 'short' | 'meal' | 'overnight';
    includeBreaksInTotal: boolean;

    // Sauvegarde automatique
    autoSaveEnabled: boolean;
    autoSaveFrequency: number;

    // Préférences de carte
    mapStyle: 'standard' | 'satellite' | 'terrain' | 'dark';
    defaultZoom: number;
    showPOI: boolean;

    // Affichage
    distanceUnit: 'km' | 'mi';
}

const defaultSettings: GlobalSettings = {
    convoyName: 'Mon convoi',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '08:00',
    routeType: 'fastest',
    averageSpeed: 90,
    breakInterval: 2,
    breakDuration: 30,
    breakType: 'meal',
    includeBreaksInTotal: true,
    autoSaveEnabled: true,
    autoSaveFrequency: 2,
    mapStyle: 'standard',
    defaultZoom: 10,
    showPOI: true,
    distanceUnit: 'km'
};

export function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
    const [settings, setSettings] = useState<GlobalSettings>(initialSettings || defaultSettings);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={handleOverlayClick}>
            <div className="settings-modal">
                {/* Header */}
                <div className="settings-modal-header">
                    <h2>
                        <span>⚙️</span>
                        Paramètres globaux
                    </h2>
                    <button className="settings-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="settings-modal-content">
                    <div className="settings-section">
                        <div className="settings-section-title">
                            <span>📍</span>
                            Informations du convoi
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Nom du convoi</label>
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="Ex: Tour C15 Été 2026"
                                value={settings.convoyName}
                                onChange={(e) => setSettings({...settings, convoyName: e.target.value})}
                            />
                        </div>

                        <div className="settings-form-row">
                            <div className="settings-form-group">
                                <label className="settings-label">Date de départ</label>
                                <input
                                    type="date"
                                    className="settings-input"
                                    value={settings.departureDate}
                                    onChange={(e) => setSettings({...settings, departureDate: e.target.value})}
                                />
                            </div>
                            <div className="settings-form-group">
                                <label className="settings-label">Heure de départ</label>
                                <input
                                    type="time"
                                    className="settings-input"
                                    value={settings.departureTime}
                                    onChange={(e) => setSettings({...settings, departureTime: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Route */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            <span>🚗</span>
                            Préférences de route
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Type de route</label>
                            <select
                                className="settings-select"
                                value={settings.routeType}
                                onChange={(e) => setSettings({...settings, routeType: e.target.value as 'fastest' | 'shortest' | 'balanced'})}
                            >
                                <option value="fastest">Plus rapide (recommandé)</option>
                                <option value="shortest">Plus court (distance)</option>
                                <option value="balanced">Équilibré</option>
                            </select>
                            <div className="settings-hint">Définit comment la route est calculée</div>
                        </div>

                        <div className="settings-form-row">
                            <div className="settings-form-group">
                                <label className="settings-label">Vitesse moyenne (km/h)</label>
                                <input
                                    type="number"
                                    className="settings-input"
                                    value={settings.averageSpeed}
                                    onChange={(e) => setSettings({...settings, averageSpeed: Number(e.target.value)})}
                                    min="30"
                                    max="130"
                                />
                            </div>
                            <div className="settings-form-group">
                                <label className="settings-label">Pause toutes les (heures)</label>
                                <input
                                    type="number"
                                    className="settings-input"
                                    value={settings.breakInterval}
                                    onChange={(e) => setSettings({...settings, breakInterval: Number(e.target.value)})}
                                    min="0"
                                    max="6"
                                    step="0.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Pauses */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            <span>☕</span>
                            Gestion des pauses
                        </div>

                        <div className="settings-form-row">
                            <div className="settings-form-group">
                                <label className="settings-label">Durée de pause</label>
                                <select
                                    className="settings-select"
                                    value={settings.breakDuration}
                                    onChange={(e) => setSettings({...settings, breakDuration: Number(e.target.value)})}
                                >
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 heure</option>
                                </select>
                            </div>
                            <div className="settings-form-group">
                                <label className="settings-label">Type de pause</label>
                                <select
                                    className="settings-select"
                                    value={settings.breakType}
                                    onChange={(e) => setSettings({...settings, breakType: e.target.value as 'short' | 'meal' | 'overnight'})}
                                >
                                    <option value="short">Courte (café)</option>
                                    <option value="meal">Repas</option>
                                    <option value="overnight">Nuit (hébergement)</option>
                                </select>
                            </div>
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.includeBreaksInTotal}
                                    onChange={(e) => setSettings({...settings, includeBreaksInTotal: e.target.checked})}
                                />
                                Inclure les pauses dans le calcul de durée totale
                            </label>
                        </div>
                    </div>

                    {/* Section Sauvegarde */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            <span>💾</span>
                            Sauvegarde automatique
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.autoSaveEnabled}
                                    onChange={(e) => setSettings({...settings, autoSaveEnabled: e.target.checked})}
                                />
                                Activer la sauvegarde automatique
                            </label>
                            <div className="settings-hint">Le convoi sera enregistré automatiquement lors des modifications</div>
                        </div>

                        {settings.autoSaveEnabled && (
                            <div className="settings-form-group">
                                <label className="settings-label">Fréquence de sauvegarde</label>
                                <select
                                    className="settings-select"
                                    value={settings.autoSaveFrequency}
                                    onChange={(e) => setSettings({...settings, autoSaveFrequency: Number(e.target.value)})}
                                >
                                    <option value="0">Immédiate (à chaque modification)</option>
                                    <option value="1">1 minute</option>
                                    <option value="2">2 minutes</option>
                                    <option value="5">5 minutes</option>
                                    <option value="10">10 minutes</option>
                                </select>
                                <div className="settings-hint">Délai avant la sauvegarde automatique</div>
                            </div>
                        )}
                    </div>

                    {/* Section Carte */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            <span>🗺️</span>
                            Préférences de carte
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Style de carte</label>
                            <select
                                className="settings-select"
                                value={settings.mapStyle}
                                onChange={(e) => setSettings({...settings, mapStyle: e.target.value as 'standard' | 'satellite' | 'terrain' | 'dark'})}
                            >
                                <option value="standard">Standard (OpenStreetMap)</option>
                                <option value="satellite">Satellite</option>
                                <option value="terrain">Terrain</option>
                                <option value="dark">Sombre</option>
                            </select>
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Zoom par défaut</label>
                            <input
                                type="range"
                                min="5"
                                max="15"
                                value={settings.defaultZoom}
                                onChange={(e) => setSettings({...settings, defaultZoom: Number(e.target.value)})}
                                className="settings-slider"
                            />
                            <div className="settings-hint">Niveau {settings.defaultZoom}</div>
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.showPOI}
                                    onChange={(e) => setSettings({...settings, showPOI: e.target.checked})}
                                />
                                Afficher les points d'intérêt (stations, restaurants)
                            </label>
                        </div>
                    </div>

                    {/* Section Affichage */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            <span>👁️</span>
                            Affichage
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Unité de distance</label>
                            <select
                                className="settings-select"
                                value={settings.distanceUnit}
                                onChange={(e) => setSettings({...settings, distanceUnit: e.target.value as 'km' | 'mi'})}
                            >
                                <option value="km">Kilomètres (km)</option>
                                <option value="mi">Miles (mi)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="settings-modal-footer">
                    <button className="settings-btn settings-btn-cancel" onClick={onClose}>
                        Annuler
                    </button>
                    <button className="settings-btn settings-btn-save" onClick={handleSave}>
                        💾 Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}