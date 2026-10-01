"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastSystem";

export default function ContactPage() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email address.");
    if (message.trim().length < 10) return setErr("Please write at least a short message (10+ characters).");
    setErr(null);
    try {
      const prev = JSON.parse(localStorage.getItem("lo.contact") ?? "[]") as unknown[];
      localStorage.setItem("lo.contact", JSON.stringify([...prev, { name, email, message, at: new Date().toISOString() }]));
    } catch {
      /* private mode */
    }
    setSent(true);
    toast("Message saved locally (demo).", "success");
  };

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <p className="hairline mb-3 text-[11px] font-extrabold text-cyan">Contact</p>
      <h1 className="font-display text-4xl font-bold text-ink">Get in touch</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-dim">
        Questions, feedback or feature ideas — we'd love to hear them.
      </p>

      <div className="glass-card glow-ring mt-8 rounded-2xl p-6">
        {sent ? (
          <div className="py-10 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-ok/50 bg-ok/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink">Message saved</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">
              This is a demo environment — your message was stored on this device only. No email was sent.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setName("");
                setEmail("");
                setMessage("");
              }}
              className="btn-ghost mt-6 rounded-xl px-5 py-2.5 text-sm font-bold"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="c-name">Name</label>
                <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="neon-input w-full rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="c-email">Email</label>
                <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="neon-input w-full rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="hairline mb-1.5 block text-[11px] font-bold text-ink-dim" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="What's on your mind?" className="neon-input w-full resize-y rounded-xl px-4 py-3 text-sm leading-relaxed" />
            </div>
            {err && <p className="text-sm text-danger">{err}</p>}
            <button type="submit" className="btn-neon w-full rounded-xl py-3 text-sm sm:w-auto sm:px-8">
              Send message
            </button>
            <p className="text-[11px] text-ink-faint">
              Demo environment: messages are saved to your browser's local storage only. No data leaves this device.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
