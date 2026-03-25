import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("auth_token")
    );

    const login = (newToken: string) => {
        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

/** Helper for non-component code (classes, utils) */
export function getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
}
