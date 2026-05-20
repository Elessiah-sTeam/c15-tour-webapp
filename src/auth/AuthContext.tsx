import { useState, type ReactNode } from "react";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("auth_token")
    );

    const [email, setEmail] = useState<string | null>(() =>
        localStorage.getItem("auth_email")
    );

    const login = (newToken: string, newEmail?: string) => {
        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
        if (newEmail) {
            localStorage.setItem("auth_email", newEmail);
            setEmail(newEmail);
        }
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_email");
        setToken(null);
        setEmail(null);
    };

    const handleSetEmail = (newEmail: string | null) => {
        if (newEmail) {
            localStorage.setItem("auth_email", newEmail);
        } else {
            localStorage.removeItem("auth_email");
        }
        setEmail(newEmail);
    };

    return (
        <AuthContext.Provider value={{ token, email, login, logout, setEmail: handleSetEmail }}>
            {children}
        </AuthContext.Provider>
    );
}
