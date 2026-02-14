import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
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

export const BASE_NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=";

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type UseSearchBarLogicParams = {
  onLocationSelected: (coords: LatLngExpression, label: string) => void;
  refs: SearchBarRefs;
};

type SearchBarState = {
  query: string;
  isLoading: boolean;
  error: string | null;
  results: NominatimResult[];
  mustFillAddress: boolean;
  showWarning: boolean;
};

type SearchBarRefs = {
  formRef: RefObject<HTMLFormElement | null>;
  listRef: RefObject<HTMLUListElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
};

const shortenDisplayName = (value: string): string => {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length >= 3 && /^\d+[A-Za-z]?$/.test(parts[0])) {
    const street = `${parts[0]} ${parts[1]}`;
    return `${street}, ${parts[2]}`;
  }

  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  if (parts.length === 1) return parts[0];
  return value;
};

const deduplicateByName = (items: NominatimResult[]): NominatimResult[] => {
  const seenNames = new Set<string>();
  return items.filter((item) => {
    const key = item.display_name.trim().toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
};

export const useSearchBarLogic = ({
  onLocationSelected,
  refs,
}: UseSearchBarLogicParams) => {
  const map = useMap();
  const itinerary = useItinerary(itineraryModel.store);
  const searchIntent = useSearchIntent();

  const { formRef, listRef, inputRef } = refs;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NominatimResult[]>([]);

  const mustFillAddress = Boolean(searchIntent.target);
  const showWarning = mustFillAddress && query.trim().length === 0;

  useEffect(() => {
    if (!formRef.current) return;
    DomEvent.disableClickPropagation(formRef.current);
    DomEvent.disableScrollPropagation(formRef.current);
  }, [formRef]);

  useEffect(() => {
    if (!listRef.current) return;
    DomEvent.disableClickPropagation(listRef.current);
    DomEvent.disableScrollPropagation(listRef.current);
  }, [listRef, results]);

  useEffect(() => {
    if (!searchIntent.target) return;

    setQuery("");
    setResults([]);
    setError(null);

    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef, searchIntent.focusRequestId, searchIntent.target]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  const ensureDestinationSegment = useCallback((): Segment | null => {
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
        distance:0,
      },
      isStartEnd: false,
      steps: [],
    };

    itineraryModel.addSegment(newSegment);
    return newSegment;
  }, [itinerary.segments]);

  const applySelectionToItinerary = useCallback(
    (label: string, coords: LatLngExpression) => {
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
          itineraryModel.setStepLocation(
            searchIntent.target.segmentId,
            searchIntent.target.stepId,
            { lat, lon }
          );
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
    },
    [ensureDestinationSegment, searchIntent.target]
  );

  const selectResult = useCallback(
    (item: NominatimResult) => {
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
    },
    [applySelectionToItinerary, map, onLocationSelected, query]
  );

  const fetchResults = useCallback(
    async (value: string) => {
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

        setResults(deduplicateByName(parsed));
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.error(e);
        setError("Impossible de rechercher pour l'instant");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = query.trim();
      if (!value) return;

      if (results.length > 0) {
        selectResult(results[0]);
        return;
      }

      await fetchResults(value);
    },
    [fetchResults, query, results, selectResult]
  );

  const handleChange = useCallback(
    (value: string) => {
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
    },
    [fetchResults]
  );

  const cancelSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    setResults([]);
    setError(null);
    setQuery("");

    if (searchIntent.target) {
      itineraryModel.removeStep(
        searchIntent.target.segmentId,
        searchIntent.target.stepId
      );
    }
    clearSearchIntent();
  }, [searchIntent.target]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mustFillAddress) {
        e.preventDefault();
        cancelSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelSearch, mustFillAddress]);

  const state: SearchBarState = {
    query,
    isLoading,
    error,
    results,
    mustFillAddress,
    showWarning,
  };

  const handlers = { handleSearch, handleChange, selectResult, cancelSearch };

  return { state, handlers };
};
