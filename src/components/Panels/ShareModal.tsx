import { X, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import './ShareModal.css';

type ShareModalProps = {
    shareCode: string;
    onClose: () => void;
}

export default function ShareModal({ shareCode, onClose }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const modalContent = (
        <div className="share-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <button className="share-close-btn" onClick={onClose} aria-label="Fermer">
                    <X size={18} color="#BB487C" />
                </button>

                <h2 className="share-title">Partager le convoi</h2>

                <div className="share-qr-container">
                    <QRCodeSVG
                        value={shareCode}
                        size={180}
                        bgColor="transparent"
                        fgColor="#8c1f65"
                        level="M"
                    />
                </div>

                <div className="share-code-row">
                    <span className="share-code-label">Code :</span>
                    <span className="share-code-value">{shareCode}</span>
                    <button className="share-copy-btn" onClick={handleCopy} aria-label="Copier le code">
                        {copied ? <Check size={16} color="#4caf50" /> : <Copy size={16} color="#BB487C" />}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
