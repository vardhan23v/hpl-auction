"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
type S = Record<string, unknown>;
export function SettingsForm() {
  const [s, setS] = useState<S | null>(null); const [busy, setBusy] = useState(false); const { push } = useToast();
  useEffect(() => { fetch("/api/admin/settings").then((r) => r.json()).then(setS); }, []);
  if (!s) return <div className="text-muted">Loading…</div>;
  const set = (k: string, v: unknown) => setS({ ...s, [k]: v });
  const dt = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 16) : "");
  async function save() {
    setBusy(true);
    const body = { ...s, auctionDate: s!.auctionDate ? new Date(s!.auctionDate as string).toISOString() : null, registrationDeadline: s!.registrationDeadline ? new Date(s!.registrationDeadline as string).toISOString() : null };
    delete (body as S).id; delete (body as S).updatedAt;
    const r = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); setBusy(false);
    push({ title: r.ok ? "Settings saved" : "Failed", body: r.ok ? undefined : j.error, tone: r.ok ? "success" : "error" });
  }
  const N = ({ k, label }: { k: string; label: string }) => <div><label className="label">{label}</label><input className="input" type="number" value={s[k] as number} onChange={(e) => set(k, Number(e.target.value))} /></div>;
  const C = ({ k, label }: { k: string; label: string }) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s[k]} onChange={(e) => set(k, e.target.checked)} /> {label}</label>;
  return (
    <div><h1 className="display text-4xl">Auction Settings</h1>
      <div className="card mt-4 grid gap-3 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Auction name</label><input className="input" value={s.auctionName as string} onChange={(e) => set("auctionName", e.target.value)} /></div>
        <div><label className="label">Auction date &amp; time</label><input className="input" type="datetime-local" value={dt(s.auctionDate)} onChange={(e) => set("auctionDate", e.target.value)} /></div>
        <div><label className="label">Registration deadline</label><input className="input" type="datetime-local" value={dt(s.registrationDeadline)} onChange={(e) => set("registrationDeadline", e.target.value)} /></div>
        <N k="startingPurse" label="Starting purse per team (₹) — only before auction starts" /><N k="maxSquadSize" label="Maximum squad size" /><N k="maxPlayers" label="Maximum players" /><N k="bidIncrement" label="Bid increment (₹)" /><N k="timerSeconds" label="Timer duration (seconds)" />
        <div className="flex flex-col gap-2 sm:col-span-2"><C k="registrationOpen" label="Registration open" /><C k="spectatorAccess" label="Spectator access to /live" /><C k="unsoldReentry" label="Allow unsold players to re-enter the queue" /></div>
      </div>
      <button className="btn-gold mt-4" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
    </div>
  );
}
