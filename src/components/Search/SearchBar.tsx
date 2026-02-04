import { useEffect, useRef, useState, useCallback } from "react";
import type { FormEvent } from "react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { DomEvent } from "leaflet";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import type { Segment } from "../../customObject/Itinerary/types.ts";
import { TimeSpan } from "../../customObject/TimeSpan.ts";
import {
  clearSearchIntent,
  useSearchIntent,
} from "../../customObject/Search/SearchIntentStore.ts";

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

const shortenDisplayName = (value: string): string => {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Cas où Nominatim renvoie "12, Rue ..., Ville, ..."
  if (parts.length >= 3 && /^\d+[A-Za-z]?$/.test(parts[0])) {
    const street = `${parts[0]} ${parts[1]}`; // pas de virgule entre numéro et rue
    return `${street}, ${parts[2]}`; // conserve la ville
  }

  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  if (parts.length === 1) return parts[0];
  return value;
};

export default function SearchBar({ onLocationSelected }: Props) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const itinerary = useItinerary(itineraryModel.store);
  const searchIntent = useSearchIntent();
  const mustFillAddress = Boolean(searchIntent.target);
  const showWarning = mustFillAddress && query.trim().length === 0;

  const formRef = useRef<HTMLFormElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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
    if (!searchIntent.target) return;

    setQuery("");
    setResults([]);
    setError(null);

    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [searchIntent.focusRequestId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const ensureDestinationSegment = (): Segment | null => {
    const regularSegments = itinerary.segments.filter(
      (seg) => !seg.isStartEnd
    );
    if (regularSegments.length > 0) {
      return regularSegments[regularSegments.length - 1];
    }

    const newSegment: Segment = {
      id: "auto-seg-" + new Date().toISOString(),
      content: {
        title: "Nouveau segment",
        hour: new Date(),
        duration: new TimeSpan(),
      },
      isStartEnd: false,
      steps: [],
    };

    itineraryModel.addSegment(newSegment);
    return newSegment;
  };

  const applySelectionToItinerary = (
    label: string,
    coords: LatLngExpression
  ) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    if (searchIntent.target) {
      itineraryModel.renameStep(
        searchIntent.target.segmentId,
        searchIntent.target.stepId,
        trimmed
      );
      if (Array.isArray(coords)) {
        const [lat, lon] = coords as [number, number];
        itineraryModel.setStepLocation(searchIntent.target.segmentId, searchIntent.target.stepId, {
          lat,
          lon,
        });
      }
      clearSearchIntent();
      return;
    }

    const targetSegment = ensureDestinationSegment();
    if (!targetSegment) return;

    const stepId = "search" + new Date().toISOString();
    itineraryModel.addStep(targetSegment.id, {
      id: stepId,
      content: {
        title: trimmed,
        duration: new TimeSpan(),
        ...(Array.isArray(coords)
          ? { location: { lat: coords[0] as number, lon: coords[1] as number } }
          : {}),
      },
    });
  };

  const selectResult = (item: NominatimResult) => {
    const coords: LatLngExpression = [
      parseFloat(item.lat),
      parseFloat(item.lon),
    ];
    map.flyTo(coords, 15, { duration: 1.25 });
    const fullLabel = (item.display_name || query).trim();
    const label = shortenDisplayName(fullLabel);
    onLocationSelected(coords, label);
    applySelectionToItinerary(label, coords);
    setQuery(label);
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

  const cancelSearch = useCallback(() => {
    // stop pending fetches/debounces
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    // clear UI state
    setResults([]);
    setError(null);
    setQuery("");

    // delete the placeholder step if we were in an enforced search flow
    if (searchIntent.target) {
      itineraryModel.removeStep(
        searchIntent.target.segmentId,
        searchIntent.target.stepId
      );
    }
    clearSearchIntent();
  }, [searchIntent.target]);

  // ESC to cancel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mustFillAddress) {
        e.preventDefault();
        cancelSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mustFillAddress, cancelSearch]);

  return (
    <>
      {mustFillAddress && (
        <button
          type="button"
          className="search-guard"
          aria-label="Annuler la recherche"
          onClick={cancelSearch}
        />
      )}
      <form ref={formRef} className="search-bar" onSubmit={handleSearch}>
        <div className="search-bar-inner">
          <span className="search-icon" aria-hidden>
            {"\uD83D\uDD0D"}
          </span>
          <input
            type="text"
            value={query}
            ref={inputRef}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Rechercher un point d'interet"
            aria-label="Rechercher un point d'interet"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "..." : "OK"}
          </button>
        </div>

        {showWarning && (
          <span className="search-warning">
            Ajoutez une adresse pour valider l'étape
          </span>
        )}

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
    </>
  );
}
