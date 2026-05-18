import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Map } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import "./LoginPage.css";

const BACKEND_URL = "http://localhost:8080";

type LoginLocationState = {
    message?: string;
};

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LoginLocationState | null;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(state?.message ?? null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setNotice(null);
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError("Identifiants incorrects. Veuillez réessayer.");
                return;
            }

            const data = await res.json();
            login(data.token);
            navigate("/", { replace: true });
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
                    <h1 className="login-card__title">Connexion</h1>
                    <p className="login-card__subtitle">Accédez à votre espace de planification</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-form__field">
                        <label className="login-form__label" htmlFor="username">
                            Identifiant
                        </label>
                        <input
                            id="username"
                            type="text"
                            className={`login-form__input${error ? " login-form__input--error" : ""}`}
                            placeholder="Votre identifiant"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="login-form__field">
                        <label className="login-form__label" htmlFor="password">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={`login-form__input${error ? " login-form__input--error" : ""}`}
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {notice && <p className="login-form__notice">{notice}</p>}
                    {error && <p className="login-form__error">{error}</p>}

                    <button type="submit" className="login-form__submit" disabled={loading}>
                        {loading ? "Connexion en cours…" : "Se connecter"}
                    </button>
                </form>

                <p className="login-form__footer">
                    Pas encore de compte ?
                    <Link className="login-form__link" to="/register">
                        Créer un compte
                    </Link>
                </p>
            </div>
        </div>
    );
}
