import type { RefObject } from "react";
import type { NominatimResult } from "./useSearchBarLogic";

type Props = {
  results: NominatimResult[];
  onSelect: (item: NominatimResult) => void;
  listRef: RefObject<HTMLUListElement | null>;
};

const SearchResults = ({ results, onSelect, listRef }: Props) => {
  if (results.length === 0) return null;

  return (
    <ul className="search-results" ref={listRef}>
      {results.map((item, idx) => (
        <li key={`${item.display_name}-${idx}`}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="search-result"
          >
            <span className="result-title">{item.display_name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default SearchResults;
