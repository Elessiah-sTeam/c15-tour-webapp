import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { validatePassword } from "../auth/passwordValidation";
import "./LoginPage.css";

const BACKEND_URL = "http://localhost:8080";

type RegisterResponse = {
    token?: string;
};

export default function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (res.status === 409) {
                setError("Cette adresse email est déjà utilisée.");
                return;
            }

            if (!res.ok) {
                setError("Impossible de créer le compte. Vérifiez vos informations.");
                return;
            }

            const data: RegisterResponse = await res.json().catch(() => ({}));

            if (data.token) {
                login(data.token, email);
                navigate("/", { replace: true });
                return;
            }

            navigate("/login", {
                replace: true,
                state: { message: "Compte créé avec succès. Vous pouvez vous connecter." },
            });
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
                        <Map size={22} />
                    </span>
                    <span>C15 Fiesta Tour</span>
                </div>

                <div className="login-card__heading">
                    <h1 className="login-card__title">Inscription</h1>
                    <p className="login-card__subtitle">Créez votre accès à l’espace de planification</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-form__field">
                        <label className="login-form__label" htmlFor="register-email">
                            Adresse email
                        </label>
                        <input
                            id="register-email"
                            type="email"
                            className={`login-form__input${error ? " login-form__input--error" : ""}`}
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="login-form__field">
                        <label className="login-form__label" htmlFor="register-password">
                            Mot de passe
                        </label>
                        <input
                            id="register-password"
                            type="password"
                            className={`login-form__input${error ? " login-form__input--error" : ""}`}
                            placeholder="Créez un mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <div className="login-form__field">
                        <label className="login-form__label" htmlFor="confirm-password">
                            Confirmer le mot de passe
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            className={`login-form__input${error ? " login-form__input--error" : ""}`}
                            placeholder="Retapez votre mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {error && <p className="login-form__error">{error}</p>}

                    <button type="submit" className="login-form__submit" disabled={loading}>
                        {loading ? "Création du compte…" : "Créer mon compte"}
                    </button>
                </form>

                <p className="login-form__footer">
                    Déjà inscrit ?
                    <Link className="login-form__link" to="/login">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    );
}
