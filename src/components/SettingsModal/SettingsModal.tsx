import { type MouseEvent, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Save } from 'lucide-react';
import './SettingsModal.css';
import type { GlobalSettings } from './settingsTypes.ts';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: GlobalSettings) => void;
    initialSettings?: GlobalSettings;
}

const defaultSettings: GlobalSettings = {
    convoyName: 'Mon convoi',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '08:00',
    speedPercentage: 100,
    minSegmentDuration: 1,
    maxSegmentDuration: 4,
    pauseConfigs: []
};

export function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
    const [settings, setSettings] = useState<GlobalSettings>(initialSettings ?? defaultSettings);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const updatePauseDuration = (segmentId: string, duration: number) => {
        setSettings(prev => ({
            ...prev,
            pauseConfigs: prev.pauseConfigs.map(p =>
                p.segmentId === segmentId ? { ...p, duration } : p
            )
        }));
    };

    return createPortal(
        <div
            className="settings-modal-overlay"
            role="button"
            aria-label="Fermer"
            tabIndex={0}
            onClick={handleOverlayClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); onClose(); } }}
        >
            <div className="settings-modal" role="dialog" aria-modal="true">
                {/* Header */}
                <div className="settings-modal-header">
                    <h2>
                        <Settings size={18} />
                        Paramètres globaux
                    </h2>
                    <button className="settings-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="settings-modal-content">
                    {/* Section Informations */}
                    <div className="settings-section">
                        <div className="settings-section-title">
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

                    {/* Section Vitesse */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            Vitesse de conduite
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">
                                Pourcentage sur les limites de vitesse : {settings.speedPercentage}%
                            </label>
                            <input
                                type="range"
                                min="20"
                                max="130"
                                value={settings.speedPercentage}
                                onChange={(e) => setSettings({...settings, speedPercentage: Number(e.target.value)})}
                                className="settings-slider"
                            />
                        </div>
                    </div>

                    {/* Section Segments */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            Durée des segments
                        </div>

                        <div className="settings-form-row">
                            <div className="settings-form-group">
                                <label className="settings-label">Durée minimale (heures)</label>
                                <input
                                    type="number"
                                    className="settings-input"
                                    value={settings.minSegmentDuration}
                                    onChange={(e) => setSettings({...settings, minSegmentDuration: Number(e.target.value)})}
                                    min="0.5"
                                    max="6"
                                    step="0.5"
                                />
                            </div>
                            <div className="settings-form-group">
                                <label className="settings-label">Durée maximale (heures)</label>
                                <input
                                    type="number"
                                    className="settings-input"
                                    value={settings.maxSegmentDuration}
                                    onChange={(e) => setSettings({...settings, maxSegmentDuration: Number(e.target.value)})}
                                    min="1"
                                    max="8"
                                    step="0.5"
                                />
                            </div>
                        </div>
                        <div className="settings-hint">
                            Définit la durée de conduite avant une pause obligatoire
                        </div>
                    </div>

                    {/* Section Pauses dynamiques */}
                    <div className="settings-section">
                        <div className="settings-section-title">
                            Pauses (minutes)
                        </div>

                        {settings.pauseConfigs.length === 0 ? (
                            <div className="settings-hint">
                                Les pauses apparaîtront ici une fois créés dans votre itinéraire
                            </div>
                        ) : (
                            settings.pauseConfigs.map((pause) => (
                                <div key={pause.segmentId} className="settings-form-group">
                                    <label className="settings-label">
                                        Pause  "{pause.segmentName}"
                                    </label>
                                    <input
                                        type="number"
                                        className="settings-input"
                                        value={pause.duration}
                                        onChange={(e) => updatePauseDuration(pause.segmentId, Number(e.target.value))}
                                        min="0"
                                        max="120"
                                        step="5"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="settings-modal-footer">
                    <button className="settings-btn settings-btn-cancel" onClick={onClose}>
                        Annuler
                    </button>
                    <button className="settings-btn settings-btn-save" onClick={handleSave}>
                        <Save size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Enregistrer
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
