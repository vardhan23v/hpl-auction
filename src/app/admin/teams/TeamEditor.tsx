"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { ImageUpload } from "@/components/ImageUpload";
import { TeamBadge } from "@/components/TeamBadge";
import { inr } from "@/lib/format";
type T = { id: string; name: string; abbreviation: string; color: string; logoUrl: string | null; captainName: string | null; captainEmail: string | null; isDummy: boolean; purse: number; squadCount: number };
export function TeamEditor({ team }: { team: T }) {
  const [f, setF] = useState({ ...team, captainPassword: "" }); const [busy, setBusy] = useState(false);
  const { push } = useToast(); const r = useRouter();
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  async function save() {
    setBusy(true);
    const body: Record<string, unknown> = { name: f.name, abbreviation: f.abbreviation.toUpperCase(), color: f.color, logoUrl: f.logoUrl ?? "", captainName: f.captainName, captainEmail: f.captainEmail ?? "", isDummy: f.isDummy };
    if (f.captainPassword) body.captainPassword = f.captainPassword;
    const res = await fetch(`/api/admin/teams/${team.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) return push({ title: "Save failed", body: j.error, tone: "error" });
    push({ title: "Team saved", tone: "success" }); r.refresh();
  }
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3"><TeamBadge name={f.name} abbreviation={f.abbreviation} color={f.color} logoUrl={f.logoUrl} size={48} /><div><div className="display text-2xl">{f.name}</div><div className="text-xs text-muted">{inr(team.purse)} · {team.squadCount} players {f.isDummy && "· dummy"}</div></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><label className="label">Team name</label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label className="label">Abbreviation</label><input className="input" maxLength={5} value={f.abbreviation} onChange={(e) => set("abbreviation", e.target.value)} /></div>
        <div><label className="label">Captain name</label><input className="input" value={f.captainName ?? ""} onChange={(e) => set("captainName", e.target.value)} /></div>
        <div><label className="label">Captain email (login)</label><input className="input" type="email" value={f.captainEmail ?? ""} onChange={(e) => set("captainEmail", e.target.value)} /></div>
        <div><label className="label">Set captain password</label><input className="input" type="password" placeholder="leave blank to keep" value={f.captainPassword} onChange={(e) => set("captainPassword", e.target.value)} /></div>
        <div><label className="label">Team colour</label><div className="flex gap-2"><input type="color" className="h-10 w-14 rounded border border-line bg-panel-2" value={f.color} onChange={(e) => set("color", e.target.value)} /><input className="input" value={f.color} onChange={(e) => set("color", e.target.value)} /></div></div>
        <div className="sm:col-span-2"><label className="label">Logo</label><ImageUpload value={f.logoUrl ?? ""} onChange={(u) => set("logoUrl", u)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isDummy} onChange={(e) => set("isDummy", e.target.checked)} /> Dummy / placeholder team</label>
      </div>
      <button className="btn-gold mt-4" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save team"}</button>
    </div>
  );
}
