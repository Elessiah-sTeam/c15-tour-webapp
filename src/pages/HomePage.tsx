import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeLanding from "../components/Home/HomeLanding.tsx";
import { AccountSettingsModal } from "../components/AccountSettings/AccountSettingsModal";
import {itineraryModel} from "../customObject/Itinerary/ItineraryStore.ts";
import { useAuth } from "../auth/useAuth";

export default function HomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <HomeLanding
        onCreateNew={() => {
          itineraryModel.reset();
          navigate("/planner")
        }}
        onOpenHistory={() => navigate("/history")}
        onOpenAccountSettings={() => setAccountSettingsOpen(true)}
      />
      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}
