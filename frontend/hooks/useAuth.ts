import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, API_BASE_URL } from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    
    if (t) {
      apiFetch("/auth/me")
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
          router.push("/login?expired=true");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      router.push("/login?expired=true");
    };
    
    window.addEventListener("auth-expired", handleExpired);
    return () => window.removeEventListener("auth-expired", handleExpired);
  }, [router]);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return { user, token, loading, login, logout };
}
