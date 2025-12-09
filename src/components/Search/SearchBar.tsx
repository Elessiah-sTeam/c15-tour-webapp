import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { DomEvent } from "leaflet";

import "./SearchBar.css";

type Props = {
  onLocationSelected: (coords: LatLngExpression, label: string) => void;
};

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=";

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

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!formRef.current) return;
    DomEvent.disableClickPropagation(formRef.current);
    DomEvent.disableScrollPropagation(formRef.current);
  }, []);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${NOMINATIM_URL}${encodeURIComponent(value)}`
      );
      if (!response.ok) throw new Error("Request failed");

      const results = (await response.json()) as NominatimResult[];
      if (!Array.isArray(results) || results.length === 0) {
        setError("Lieu introuvable");
        return;
      }

      const { lat, lon, display_name } = results[0];
      const coords: LatLngExpression = [parseFloat(lat), parseFloat(lon)];

      map.flyTo(coords, 15, { duration: 1.25 });
      onLocationSelected(coords, display_name || value);
    } catch (e) {
      console.error(e);
      setError("Impossible de rechercher pour l'instant");
    } finally {
      setIsLoading(false);
    }
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un point d'intérêt"
          aria-label="Rechercher un point d'intérêt"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "..." : "OK"}
        </button>
      </div>
      {error && <span className="search-error">{error}</span>}
    </form>
  );
}
