import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CarFront } from "lucide-react";
import "./LoginPage.css";

const BACKEND_URL = "http://localhost:8080";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                setError("Une erreur s'est produite. Veuillez réessayer.");
                return;
            }

            setSuccess(true);
            setEmail("");
        } catch {
            setError("Impossible de joindre le serveur.");
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

                <div className="login-card__heading">
                    <h1 className="login-card__title">Mot de passe oublié</h1>
                    <p className="login-card__subtitle">Saisissez votre email pour recevoir un lien de réinitialisation</p>
                </div>

                {!success ? (
                    <>
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="login-form__field">
                                <label className="login-form__label" htmlFor="forgot-email">
                                    Adresse email
                                </label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    className={`login-form__input${error ? " login-form__input--error" : ""}`}
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            {error && <p className="login-form__error">{error}</p>}

                            <button type="submit" className="login-form__submit" disabled={loading}>
                                {loading ? "Envoi en cours…" : "Recevoir le lien"}
                            </button>
                        </form>

                        <p className="login-form__footer">
                            <Link className="login-form__link" to="/login">
                                Retour à la connexion
                            </Link>
                        </p>
                    </>
                ) : (
                    <>
                        <p className="login-form__notice">
                            Un email de réinitialisation a été envoyé à {email}. Vérifiez votre boîte de réception.
                        </p>
                        <p className="login-form__footer">
                            <Link className="login-form__link" to="/login">
                                Retour à la connexion
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
