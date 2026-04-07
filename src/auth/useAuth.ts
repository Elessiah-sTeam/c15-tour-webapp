import { useContext } from "react";
import { AuthContext, type AuthContextType } from "./authContext";

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

/** Helper for non-component code (classes, utils) */
export function getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
}
