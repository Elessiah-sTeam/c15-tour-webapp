import { useNavigate } from "react-router-dom";
import HomeLanding from "../components/Home/HomeLanding.tsx";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <HomeLanding
      onCreateNew={() => navigate("/planner")}
      onOpenHistory={() => navigate("/history")}
    />
  );
}
