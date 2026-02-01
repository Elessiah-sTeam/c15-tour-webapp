import {type JSX,type MouseEvent, useState} from "react";
import useOutsideClick from "./useOutsideClick.ts";
import './Panels/Panels.css';

export interface Props {
    currentStr: string,
    setter: (newString: string) => void,
    Tag: keyof JSX.IntrinsicElements,
    className: string,
}

export default function ClickInput({currentStr, setter, Tag, className}: Props) {
    const [isInput, setIsInput] = useState(false);
    const [text, setText] = useState<string>(currentStr);

    function stopInput() {
        setIsInput(false);
        setter(text);
    }

    const ref = useOutsideClick<HTMLDivElement>(() => {
        stopInput();
    });

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            stopInput();
        }
    }

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