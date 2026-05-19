import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CarFront } from "lucide-react";
import "./LoginPage.css";

const BACKEND_URL = "http://localhost:8080";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            if (!res.ok) {
                setError("Impossible de réinitialiser le mot de passe. Veuillez réessayer.");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-card__brand">
                    <span className="login-card__brand-icon">
                        <CarFront size={22} />
                    </span>
                    <span>C15 Fiesta Tour</span>
                </div>

                {!token || token.trim() === "" ? (
                    <>
                        <div className="login-card__heading">
                            <h1 className="login-card__title">Lien invalide</h1>
                        </div>

                        <div className="login-form__error">
                            Lien invalide ou expiré. Veuillez recommencer depuis la page mot de passe
                            oublié.
                        </div>

                        <p className="login-form__footer">
                            <Link className="login-form__link" to="/forgot-password">
                                Retour à la réinitialisation
                            </Link>
                        </p>
                    </>
                ) : success ? (
                    <>
                        <div className="login-card__heading">
                            <h1 className="login-card__title">Mot de passe réinitialisé</h1>
                        </div>

                        <div className="login-form__notice">Mot de passe réinitialisé avec succès !</div>

                        <p className="login-form__footer">
                            <Link className="login-form__link" to="/login">
                                Se connecter
                            </Link>
                        </p>
                    </>
                ) : (
                    <>
                        <div className="login-card__heading">
                            <h1 className="login-card__title">Réinitialiser le mot de passe</h1>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="login-form__field">
                                <label className="login-form__label" htmlFor="newPassword">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    className={`login-form__input${error ? " login-form__input--error" : ""}`}
                                    placeholder="Entrez votre nouveau mot de passe"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="login-form__field">
                                <label className="login-form__label" htmlFor="confirmPassword">
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className={`login-form__input${error ? " login-form__input--error" : ""}`}
                                    placeholder="Confirmez votre nouveau mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            {error && <p className="login-form__error">{error}</p>}

                            <button type="submit" className="login-form__submit" disabled={loading}>
                                {loading ? "Traitement en cours…" : "Réinitialiser"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
