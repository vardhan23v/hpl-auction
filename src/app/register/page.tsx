"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ImageUpload } from "@/components/ImageUpload";

const F = (p: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; min?: number; max?: number; step?: string }) => (
  <div><label className="label">{p.label}{p.required && " *"}</label><input className="input" name={p.name} type={p.type ?? "text"} required={p.required} placeholder={p.placeholder} min={p.min} max={p.max} step={p.step} /></div>
);

export default function Register() {
  const [status, setStatus] = useState<{ open: boolean; approved: number; max: number } | null>(null);
  const [done, setDone] = useState(false); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  useEffect(() => { fetch("/api/register").then((r) => r.json()).then(setStatus); }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    if (!photoUrl) { setErr("Profile photo is required"); setBusy(false); return; }
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, photoUrl }) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Failed");
    setDone(true);
  }
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-xs font-semibold uppercase tracking-widest text-gold">Player registration</div>
        <h1 className="display text-5xl">Enter the HPL pool</h1>
        {status && <p className="mt-2 text-sm text-muted">{status.approved} / {status.max} approved players · Registrations are <b className={status.open ? "text-emerald-400" : "text-live"}>{status.open ? "open" : "closed"}</b></p>}
        {done ? (
          <div className="card mt-8 p-10 text-center"><div className="display text-4xl text-emerald-400">Registration submitted successfully.</div><p className="mt-2 text-muted">The admin will review your profile. Approved players enter the auction queue.</p><Link href="/" className="btn-gold mt-6">Back to home</Link></div>
        ) : status && !status.open ? (
          <div className="card mt-8 p-10 text-center text-muted">Registrations are closed — the pool is full or the deadline has passed.</div>
        ) : (
          <form onSubmit={submit} className="card mt-6 grid gap-4 p-6 md:grid-cols-2">
            <div className="md:col-span-2"><label className="label">Profile photo *</label><ImageUpload value={photoUrl} onChange={setPhotoUrl} /></div>
            <F label="Full name" name="name" required /><F label="Age" name="age" type="number" min={14} max={60} />
            <F label="Phone" name="phone" type="tel" required /><F label="Email" name="email" type="email" />
            <F label="Hostel block" name="hostelBlock" placeholder="e.g. A" /><F label="Room number" name="roomNumber" />
            <div><label className="label">Playing role *</label><select name="role" className="input" required><option value="BATSMAN">Batsman</option><option value="BOWLER">Bowler</option><option value="ALL_ROUNDER">All-Rounder</option><option value="WICKETKEEPER">Wicketkeeper</option></select></div>
            <div><label className="label">Batting style</label><select name="battingStyle" className="input"><option>Right-hand bat</option><option>Left-hand bat</option></select></div>
            <div><label className="label">Bowling style</label><select name="bowlingStyle" className="input"><option value="">None</option><option>Right-arm fast</option><option>Right-arm medium</option><option>Left-arm fast</option><option>Left-arm medium</option><option>Off spin</option><option>Leg spin</option><option>Left-arm orthodox</option><option>Left-arm chinaman</option></select></div>
            <div><label className="label">Experience</label><select name="experience" className="input"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Pro</option></select></div>
            {err && <div className="rounded-lg bg-live/15 px-3 py-2 text-sm text-live md:col-span-2">{err}</div>}
            <button className="btn-gold md:col-span-2" disabled={busy}>{busy ? "Submitting…" : "Submit registration"}</button>
          </form>
        )}
      </main>
    </>
  );
}
