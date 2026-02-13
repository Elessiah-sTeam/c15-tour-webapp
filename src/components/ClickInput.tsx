import {type JSX,type MouseEvent, type KeyboardEvent, useState} from "react";
import useOutsideClick from "./useOutsideClick.ts";
import './Panels/Panels.css';

export interface Props {
    currentStr: string,
    setter: (newString: string) => void,
    Tag: keyof JSX.IntrinsicElements,
    className: string,
}

/**
 * Composant permettant l'édition d'une balise text
 *
 * Est raffraichi à chaque mise à jour de itinéraire et du champs text
 * @param currentStr contient la valeur de départ de la balise
 * @param setter fonction de mise à jour de la valeur cible
 * @param Tag nom de la balise HTML de l'élément
 * @param className className du style de la balise
 */
export default function ClickInput({currentStr, setter, Tag, className}: Props) {
    const [isInput, setIsInput] = useState(false);
    const [text, setText] = useState<string>(currentStr);

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
    });

    /**
     * Gère la pression de touche sur lors de l'édition de l'input
     * Si c'est la touche "Entrée" on appelle stopInput()
     * @param event
     */
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            stopInput();
        }
    }

    /**
     * Gère le click sur la balise visé.
     * Au click, transforme la balise en input
     * @param e
     */
    function handleClick(e: MouseEvent) {
        e.preventDefault();
        setIsInput(true);
    }

    return (
      <div ref={ref}>
          {isInput ?
              <input
                  type={"text"}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={className}
                  style={{
                      background: "#ffffff26",
                      width: "100%",
                      color: "#BB487C"
              }}
              />
              :
              <Tag
                  onClick={handleClick}
                  className={className}
              >
                  {currentStr}
              </Tag>
          }
      </div>
    );
}