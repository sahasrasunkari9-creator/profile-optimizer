"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "./ToastSystem";

interface Session {
  name: string;
  email: string;
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("lo.session");
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Profile optimizer home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan/40 bg-cyan/10">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 0-5 5v1H5a2 2 0 0 0-2 2v3.5a2.5 2.5 0 0 0 2.5 2.5H9" />
          <path d="M12 2a5 5 0 0 1 5 5v1h2a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 1-2.5 2.5H15" />
          <path d="M9 22v-3.5A2.5 2.5 0 0 1 11.5 16h1a2.5 2.5 0 0 1 2.5 2.5V22" />
          <circle cx="12" cy="12" r="2.4" />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Profile <span className="gradient-text">Optimizer</span>
      </span>
    </Link>
  );
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "AI Tools" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const toast = useToast();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [session, setSession] = useState<Session | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme === "light" ? "light" : "dark"));
    setSession(readSession());
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("lo.theme", next);
    } catch {
      /* private mode */
    }
  };

  const doLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setLoginErr("Please enter your name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLoginErr("Please enter a valid email address.");
      return;
    }
    const s = { name: name.trim(), email: email.trim() };
    setSession(s);
    try {
      localStorage.setItem("lo.session", JSON.stringify(s));
    } catch {
      /* private mode */
    }
    setLoginOpen(false);
    setLoginErr(null);
    toast(`Signed in as ${s.name} (demo session).`, "success");
  };

  const logout = () => {
    setSession(null);
    try {
      localStorage.removeItem("lo.session");
    } catch {
      /* noop */
    }
    toast("Signed out.", "info");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-bg0/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${
                  pathname === l.href
                    ? "bg-cyan/10 text-cyan"
                    : "text-ink-dim hover:bg-line/40 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="btn-ghost rounded-lg p-2.5"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            {session ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-violet/50 bg-violet/15 font-display text-sm font-bold text-purple">
                  {session.name[0]?.toUpperCase()}
                </span>
                <button onClick={logout} className="btn-ghost rounded-lg px-3.5 py-2 text-sm font-bold" title="Sign out">
                  {session.name.split(" ")[0]}
                </button>
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="btn-neon hidden rounded-lg px-4 py-2 text-sm sm:inline-flex">
                Sign in
              </button>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="btn-ghost rounded-lg p-2.5 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-line px-5 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3.5 py-2.5 text-sm font-bold ${
                    pathname === l.href ? "bg-cyan/10 text-cyan" : "text-ink-dim"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              {!session && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setLoginOpen(true);
                  }}
                  className="btn-neon mt-2 rounded-lg px-4 py-2.5 text-sm"
                >
                  Sign in (demo)
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {loginOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bg0/80 backdrop-blur-sm" onClick={() => setLoginOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Demo sign in" className="glass-card glow-ring animate-fade-up relative w-full max-w-md rounded-2xl p-6">
            <div className="mb-1 flex items-start justify-between">
              <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
              <button onClick={() => setLoginOpen(false)} className="btn-ghost rounded-lg p-2" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-5 flex items-center gap-2 text-xs text-ink-faint">
              <span className="chip-violet rounded px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider">DEMO LOGIN</span>
              Stored locally on this device only — no real authentication.
            </p>
            <form onSubmit={doLogin} className="space-y-4">
              <div>
                <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="login-name">Name</label>
                <input id="login-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" className="neon-input w-full rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="login-email">Email</label>
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" className="neon-input w-full rounded-xl px-4 py-2.5 text-sm" />
              </div>
              {loginErr && <p className="text-sm text-danger">{loginErr}</p>}
              <button type="submit" className="btn-neon w-full rounded-xl py-3 text-sm">
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
