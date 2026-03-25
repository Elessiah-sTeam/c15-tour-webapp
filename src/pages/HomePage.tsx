import { useNavigate } from "react-router-dom";
import HomeLanding from "../components/Home/HomeLanding.tsx";
import {itineraryModel} from "../customObject/Itinerary/ItineraryStore.ts";
import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <HomeLanding
      onCreateNew={() => {
        itineraryModel.reset();
        navigate("/planner")
      }}
      onOpenHistory={() => navigate("/history")}
      onLogout={handleLogout}
    />
  );
}
