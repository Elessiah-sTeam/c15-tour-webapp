import {useEffect, useRef} from "react";

export default function useOutsideClick<T extends HTMLElement>(onOutsideClick: () => void)
{
    const ref = useRef<T>(null);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(event.target as Node)) {
                onOutsideClick();
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onOutsideClick]);

    return ref;
}