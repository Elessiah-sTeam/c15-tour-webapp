import {
    type JSX,
    type MouseEvent,
    type KeyboardEvent,
    useEffect,
    useRef,
    useState
} from "react";
import useOutsideClick from "./useOutsideClick.ts";
import "./Panels/Panels.css";

export interface Props {
    currentStr: string,
    setter: (newString: string) => void,
    Tag: keyof JSX.IntrinsicElements,
    className: string,
    isDesactivated: boolean
}

/**
 * Composant permettant l'édition d'une balise text
 *
 * Est rafraîchi à chaque mise à jour de l'itinéraire et du champ text
 * @param currentStr contient la valeur de départ de la balise
 * @param setter fonction de mise à jour de la valeur cible
 * @param Tag nom de la balise HTML de l'élément
 * @param className className du style de la balise
 * @param isDesactivated si vrai = input désactivé, faux
 */
export default function ClickInput({ currentStr, setter, Tag, className, isDesactivated }: Props) {
    const [isInput, setIsInput] = useState(false);
    const [text, setText] = useState<string>(currentStr);
    const [showTooltip, setShowTooltip] = useState(false);

    const tooltipTimerRef = useRef<number | null>(null);

    function clearTooltipTimer() {
        if (tooltipTimerRef.current !== null) {
            window.clearTimeout(tooltipTimerRef.current);
            tooltipTimerRef.current = null;
        }
    }

    function handleMouseEnter() {
        if (isInput || !currentStr?.trim()) return;

        clearTooltipTimer();
        tooltipTimerRef.current = window.setTimeout(() => {
            setShowTooltip(true);
        }, 700);
    }

    function handleMouseLeave() {
        clearTooltipTimer();
        setShowTooltip(false);
    }

    useEffect(() => {
        return () => {
            clearTooltipTimer();
        };
    }, []);

    /**
     * Arrête le mode édition de la balise,
     * et applique les modifications avec la fonction setter
     */
    function stopInput() {
        if (isInput) {
            setIsInput(false);
            if (text == " " || text.length == 0) {
                setText(currentStr);
            } else {
                setter(text);
            }
        }
    }

    /**
     * Détecte les clicks en dehors de la div qui contient la ref,
     * et arrête l'input
     */
    const ref = useOutsideClick<HTMLDivElement>(() => {
        stopInput();
        setShowTooltip(false);
    });

    /**
     * Gère la pression de touche Entrée lors de l'édition de l'input
     * Si c'est la touche "Entrée" on appelle stopInput()
     * @param event
     */
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            stopInput();
        }
    }

    /**
     * Gère le click sur la balise visée.
     * Au click, transforme la balise en input
     * @param e
     */
    function handleClick(e: MouseEvent) {
        e.preventDefault();
        setShowTooltip(false);
        setIsInput(!isDesactivated);
    }

    return (
        <div
            ref={ref}
            className="click-input-wrapper"
            style={{ minWidth: 0, width: "100%", overflow: "visible" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {isInput ? (
                <input
                    type={"text"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={className}
                    style={{
                        background: "#ffffff26",
                        width: "100%",
                        minWidth: 0,
                        color: "#BB487C"
                    }}
                />
            ) : (
                <Tag
                    onClick={handleClick}
                    className={className}
                    style={{
                        width: "100%",
                        minWidth: 0,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        display: "block"
                    }}
                >
                    {currentStr}
                </Tag>
            )}

            {!isInput && showTooltip && currentStr?.trim() && (
                <div className="app-tooltip" role="tooltip">
                    {currentStr}
                </div>
            )}
        </div>
    );
}
