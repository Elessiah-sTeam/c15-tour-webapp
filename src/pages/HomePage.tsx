import { useNavigate } from "react-router-dom";
import HomeLanding from "../components/Home/HomeLanding.tsx";
import {itineraryModel} from "../customObject/Itinerary/ItineraryStore.ts";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <HomeLanding
      onCreateNew={() => {
        itineraryModel.reset();
        navigate("/planner")
      }}
      onOpenHistory={() => navigate("/history")}
    />
  );
}
