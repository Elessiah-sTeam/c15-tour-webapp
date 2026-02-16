import { ArrowRight, CarFront, FilePlus2, FolderClock, Settings } from "lucide-react";
import "./HomeLanding.css";

type HomeLandingProps = {
  onCreateNew?: () => void;
  onOpenHistory?: () => void;
};

/**
 * Page d'accueil inspirée du mockup fourni.
 */
export default function HomeLanding({
  onCreateNew,
  onOpenHistory,
}: HomeLandingProps) {
  return (
    <div className="home-landing">
      <div className="home-landing__shell">
        <header className="home-landing__header">
          <div className="home-landing__brand">
            <span className="home-landing__brand-icon" aria-hidden>
              <CarFront size={28} strokeWidth={2.4} />
            </span>
            <span className="home-landing__brand-title">C15 Fiesta Tour</span>
          </div>

          <button
            type="button"
            className="home-landing__settings"
            aria-label="Ouvrir les paramètres"
          >
            <Settings size={22} strokeWidth={2.4} />
          </button>
        </header>

        <main className="home-landing__main">
          <p className="home-landing__welcome">
            Bienvenue sur l'outil C15 Fiesta Tour 😎
          </p>
          <p className="home-landing__subtitle">
            Créez ou consultez les itinéraires de vos convois automobile&nbsp;!
          </p>

          <button
            type="button"
            className="home-card home-card--ghost"
            onClick={onOpenHistory}
            aria-disabled={!onOpenHistory}
          >
            <span className="home-card__icon home-card__icon--ghost" aria-hidden>
              <FolderClock size={36} strokeWidth={2.4} />
            </span>
            <span className="home-card__texts">
              <span className="home-card__title">
                Accéder à l'historique des convois
              </span>
              <span className="home-card__subtitle">
                Retrouver / ouvrir les itinéraires passés
              </span>
            </span>
            <ArrowRight className="home-card__chevron" size={22} strokeWidth={2.6} />
          </button>

          <div className="home-landing__divider" role="separator" aria-label="ou">
            <span>OU</span>
          </div>

          <button
            type="button"
            className="home-card home-card--accent"
            onClick={onCreateNew}
          >
            <span className="home-card__icon home-card__icon--accent" aria-hidden>
              <FilePlus2 size={36} strokeWidth={2.4} />
            </span>
            <span className="home-card__texts home-card__texts--light">
              <span className="home-card__title">Créer un nouveau convoi</span>
              <span className="home-card__subtitle">
                Démarrer un nouvel itinéraire depuis zéro
              </span>
            </span>
            <ArrowRight className="home-card__chevron home-card__chevron--light" size={22} strokeWidth={2.6} />
          </button>
        </main>
      </div>
    </div>
  );
}
