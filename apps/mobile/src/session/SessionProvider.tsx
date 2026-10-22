import { AuthResponse, PublicUser } from "@api/types";
import { localStorage, StorageKeys } from "@utils/localStorage";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

export const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:3000/v1" : "http://localhost:3000/v1";

export function mediaUri(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("/")) return `${API_BASE.replace(/\/v1$/, "")}${url}`;
  return url;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Tokens = { accessToken: string; refreshToken: string; user: PublicUser };

type SessionContextValue = {
  user: PublicUser | null;
  ready: boolean;
  loginDev: (provider: PublicUser["provider"]) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const SESSION_KEY = "session";

function deviceId() {
  const existing = localStorage.getItem("dev-device-id");
  if (existing) return existing;
  const created = `dev-${Date.now()}`;
  localStorage.setItem("dev-device-id", created);
  return created;
}

async function readError(response: Response) {
  const body = await response.json().catch(() => null);
  const code = body?.code ?? "ERROR";
  const message = body?.message ?? "요청에 실패했습니다.";
  return new ApiError(response.status, code, message);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const tokens = useRef<Tokens | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  const persist = (next: Tokens | null) => {
    tokens.current = next;
    setUser(next?.user ?? null);
    if (next) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      localStorage.setItem(StorageKeys.ACCESS_TOKEN, next.accessToken);
      localStorage.setItem(StorageKeys.REFRESH_TOKEN, next.refreshToken);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(StorageKeys.ACCESS_TOKEN);
      localStorage.removeItem(StorageKeys.REFRESH_TOKEN);
    }
  };

  const refresh = async () => {
    const current = tokens.current;
    if (!current) return null;
    if (!refreshing.current) {
      refreshing.current = (async () => {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        if (!response.ok) {
          persist(null);
          return null;
        }
        const body = (await response.json()) as AuthResponse;
        persist(body);
        return body.accessToken;
      })().finally(() => {
        refreshing.current = null;
      });
    }
    return refreshing.current;
  };

  const request = async <T,>(path: string, init?: RequestInit, retry = true): Promise<T> => {
    const headers = new Headers(init?.headers);
    const isFile = typeof FormData !== "undefined" && init?.body instanceof FormData;
    if (init?.body && !isFile && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const access = tokens.current?.accessToken;
    if (access) headers.set("Authorization", `Bearer ${access}`);
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (response.status === 401 && retry && tokens.current) {
      const next = await refresh();
      if (next) return request<T>(path, init, false);
    }
    if (!response.ok) throw await readError(response);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      setReady(true);
      return;
    }
    try {
      const saved = JSON.parse(raw) as Tokens;
      tokens.current = saved;
      setUser(saved.user);
      request<PublicUser>("/me")
        .then((me) => persist({ ...tokens.current!, user: me }))
        .catch(() => undefined)
        .finally(() => setReady(true));
    } catch {
      persist(null);
      setReady(true);
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      ready,
      loginDev: async (provider) => {
        const response = await fetch(`${API_BASE}/auth/dev`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, providerId: deviceId() }),
        });
        if (!response.ok) throw await readError(response);
        persist((await response.json()) as AuthResponse);
      },
      logout: async () => {
        const refreshToken = tokens.current?.refreshToken;
        if (refreshToken) {
          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          }).catch(() => undefined);
        }
        persist(null);
      },
      withdraw: async () => {
        await request("/me", { method: "DELETE" });
        persist(null);
      },
      request,
    }),
    [user, ready],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
