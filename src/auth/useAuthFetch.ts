import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export function useAuthFetch() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    return useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        const res = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers as Record<string, string>),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (res.status === 403) {
            logout();
            navigate("/login");
        }

        return res;
    }, [token, logout, navigate]);
}
