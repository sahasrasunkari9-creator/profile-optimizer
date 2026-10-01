"use client";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-bg0/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
        <div className="text-center sm:text-left">
          <p className="font-display text-lg font-semibold text-ink">
            AI LinkedIn <span className="gradient-text">Profile Optimizer</span>
          </p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-faint">
            Demo engine by default — content is rule-based and clearly labeled. Connect a real AI model
            server-side with <code className="text-cyan">AI_API_KEY</code> to go live. Keys never reach the browser.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: "GitHub", d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
            { label: "X", d: "M4 4l16 16M20 4L4 20" },
            { label: "LinkedIn", d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2a6 6 0 0 1 2-2zM2 9h4v12H2z" },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => undefined}
              aria-label={`${s.label} (coming soon)`}
              title={`${s.label} — coming soon`}
              className="btn-ghost rounded-lg p-2.5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.d} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-line/60 py-4 text-center text-[11px] text-ink-faint">
        © {new Date().getFullYear()} · Built for career optimization demos
      </div>
    </footer>
  );
}
