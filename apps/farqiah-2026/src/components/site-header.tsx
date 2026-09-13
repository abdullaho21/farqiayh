"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  LogOut,
  Radio,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { api, useApp } from "./app-provider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
export function LoginButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { session } = useApp();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      await api("/api/login", {
        username: data.get("username"),
        password: data.get("password"),
      });
      await session();
      setOpen(false);
      toast.success("Welcome back. Admin access is ready.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setError("");
          setShowPassword(false);
          setOpen(true);
        }}
      >
        Login <ArrowUpRight size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="dialog-symbol">
            <ShieldCheck />
          </div>
          <DialogTitle className="dialog-title">Admin login</DialogTitle>
          <DialogDescription className="muted">
            Manage the polls. Keep the conversation moving.
          </DialogDescription>
          <form onSubmit={submit} className="stack">
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                maxLength={80}
              />
            </label>
            <div className="password-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={256}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <Button disabled={busy} type="submit">
              {busy ? "Signing in…" : "Login"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function SiteHeader() {
  const pathname = usePathname();
  const { admin, live, session } = useApp();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await api("/api/logout", {});
      await session();
      toast.success("You’re logged out.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <header className={`site-header ${admin ? "is-admin" : ""}`}>
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Farqiah 2026 home">
          <span className="brand-mark">
            <BarChart3 size={24} strokeWidth={2.8} />
          </span>
          <span>
            Farqiah <span className="brand-year">2026</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/"
            className="header-home"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Explore polls
          </Link>
          <span
            className={`connection ${live ? "connected" : ""}`}
            title={
              live
                ? "Live updates connected"
                : "Reconnecting; updates refresh every 15 seconds"
            }
          >
            <Radio size={15} />
            <span>{live ? "Live updates" : "Reconnecting"}</span>
          </span>
          {admin ? (
            <>
              <Button variant="ghost" asChild>
                <Link
                  className="admin-nav-link"
                  href="/admin"
                  aria-current={
                    pathname.startsWith("/admin") ? "page" : undefined
                  }
                >
                  <ShieldCheck size={16} /> Admin Dashboard
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} disabled={busy}>
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <LoginButton />
          )}
        </nav>
      </div>
    </header>
  );
}
