import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { DomEvent } from "leaflet";

import "./SearchBar.css";

type Props = {
  onLocationSelected: (coords: LatLngExpression, label: string) => void;
};

const BASE_NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export default function SearchBar({ onLocationSelected }: Props) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NominatimResult[]>([]);

  const formRef = useRef<HTMLFormElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!formRef.current) return;
    DomEvent.disableClickPropagation(formRef.current);
    DomEvent.disableScrollPropagation(formRef.current);
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    DomEvent.disableClickPropagation(listRef.current);
    DomEvent.disableScrollPropagation(listRef.current);
  }, [results]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const selectResult = (item: NominatimResult) => {
    const coords: LatLngExpression = [
      parseFloat(item.lat),
      parseFloat(item.lon),
    ];
    map.flyTo(coords, 15, { duration: 1.25 });
    onLocationSelected(coords, item.display_name || query);
    setResults([]);
    setError(null);
  };

  const fetchResults = async (value: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const frUrl = `${BASE_NOMINATIM_URL}${encodeURIComponent(
        value
      )}&countrycodes=fr`;
      const worldUrl = `${BASE_NOMINATIM_URL}${encodeURIComponent(value)}`;

      const fetchList = async (url: string) => {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Request failed");
        const parsed = (await response.json()) as NominatimResult[];
        return Array.isArray(parsed) ? parsed : [];
      };

      let parsed = await fetchList(frUrl);
      if (parsed.length === 0) {
        parsed = await fetchList(worldUrl);
      }

      if (parsed.length === 0) {
        setResults([]);
        setError("Lieu introuvable");
        return;
      }

      // Deduplicate by the human-readable name to avoid repeated lines
      const seenNames = new Set<string>();
      const unique = parsed.filter((item) => {
        const key = item.display_name.trim().toLowerCase();
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });

      setResults(unique);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error(e);
      setError("Impossible de rechercher pour l'instant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    if (results.length > 0) {
      selectResult(results[0]);
      return;
    }

    await fetchResults(value);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setResults([]);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(trimmed);
    }, 250);
  };

  return (
    <form ref={formRef} className="search-bar" onSubmit={handleSearch}>
      <div className="search-bar-inner">
        <span className="search-icon" aria-hidden>
          {"\uD83D\uDD0D"}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Rechercher un point d'interet"
          aria-label="Rechercher un point d'interet"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "..." : "OK"}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="search-results" ref={listRef}>
          {results.map((item, idx) => (
            <li key={`${item.display_name}-${idx}`}>
              <button
                type="button"
                onClick={() => selectResult(item)}
                className="search-result"
              >
                <span className="result-title">{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <span className="search-error">{error}</span>}
    </form>
  );
}
