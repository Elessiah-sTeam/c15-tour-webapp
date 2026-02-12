import { useRef } from "react";
import type { ChangeEvent } from "react";
import type { LatLngExpression } from "leaflet";
import "./SearchBar.css";
import SearchResults from "./SearchResults";
import { useSearchBarLogic } from "./useSearchBarLogic";

type Props = {
  onLocationSelected: (coords: LatLngExpression, label: string) => void;
};

export default function SearchBar({ onLocationSelected }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { state, handlers } = useSearchBarLogic({
    onLocationSelected,
    refs: { formRef, listRef, inputRef },
  });

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) =>
    handlers.handleChange(event.target.value);

  return (
    <>
      {state.mustFillAddress && (
        <button
          type="button"
          className="search-guard"
          aria-label="Annuler la recherche"
          onClick={handlers.cancelSearch}
        />
      )}

      <form
        ref={formRef}
        className="search-bar"
        onSubmit={handlers.handleSearch}
      >
        <div className="search-bar-inner">
          <span className="search-icon" aria-hidden>
            {"\uD83D\uDD0D"}
          </span>
          <input
            type="text"
            value={state.query}
            ref={inputRef}
            onChange={onInputChange}
            placeholder="Rechercher un point d'interet"
            aria-label="Rechercher un point d'interet"
          />
          <button type="submit" disabled={state.isLoading}>
            {state.isLoading ? "..." : "OK"}
          </button>
        </div>

        {state.showWarning && (
          <span className="search-warning">
            Ajoutez une adresse pour valider l'étape
          </span>
        )}

        <SearchResults
          results={state.results}
          onSelect={handlers.selectResult}
          listRef={listRef}
        />

        {state.error && <span className="search-error">{state.error}</span>}
      </form>
    </>
  );
}
