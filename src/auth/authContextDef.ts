import { createContext } from "react";

export interface AuthContextType {
    token: string | null;
    email: string | null;
    login: (token: string, email?: string) => void;
    logout: () => void;
    setEmail: (email: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
