"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Toaster } from "sonner";
export async function api<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = await res.json();
  if (!res.ok)
    throw new Error(body.error || "Request failed. Please try again.");
  return body;
}
type AppState = {
  admin: boolean;
  ready: boolean;
  live: boolean;
  epoch: number;
  refresh: () => void;
  session: () => Promise<void>;
  sessionError: string;
};
const Context = createContext<AppState>({
  admin: false,
  ready: false,
  live: false,
  epoch: 0,
  refresh: () => {},
  session: async () => {},
  sessionError: "",
});
export const useApp = () => useContext(Context);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [sessionError, setError] = useState("");
  const refresh = useCallback(() => setEpoch((v) => v + 1), []);
  const session = useCallback(async () => {
    try {
      const state = await api<{ admin: boolean }>("/api/session");
      setAdmin(state.admin);
      setReady(true);
      setError("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [refresh]);
  useEffect(() => {
    void session();
  }, [session]);
  useEffect(() => {
    if (!ready) return;
    const events = new EventSource("/api/events");
    events.onopen = () => setLive(true);
    events.onerror = () => setLive(false);
    events.addEventListener("change", () => {
      setLive(true);
      refresh();
    });
    events.addEventListener("unavailable", () => setLive(false));
    const fallback = setInterval(refresh, 15000);
    const focus = () => {
      void session();
    };
    window.addEventListener("focus", focus);
    return () => {
      events.close();
      clearInterval(fallback);
      window.removeEventListener("focus", focus);
    };
  }, [ready, admin, refresh, session]);
  return (
    <Context.Provider
      value={{ admin, ready, live, epoch, refresh, session, sessionError }}
    >
      {children}
      <Toaster theme="light" richColors position="bottom-right" />
    </Context.Provider>
  );
}
export function useRemote<T>(path: string | null) {
  const { epoch, ready } = useApp();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!path || !ready) return;
    const controller = new AbortController();
    fetch(path, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Unable to load this page.");
        return body;
      })
      .then((value) => {
        setData(value);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [path, epoch, ready]);
  return { data, error };
}
