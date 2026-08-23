"use client";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { ImageUpload } from "@/components/ImageUpload";
export type P = { id: string; name: string; photoUrl: string | null; age: number | null; phone: string | null; email: string | null; hostelBlock: string | null; roomNumber: string | null; role: string; battingStyle: string | null; bowlingStyle: string | null; experience: string | null; previousExp: string | null; matches: number; runs: number; wickets: number; strikeRate: number | null; economy: number | null; achievements: string | null; bio: string | null; basePrice: number; status: string; soldPrice: number | null; soldTo: { name: string; color: string } | null };
const empty = { name: "", photoUrl: "", age: "", phone: "", email: "", hostelBlock: "", roomNumber: "", role: "BATSMAN", battingStyle: "", bowlingStyle: "", experience: "", previousExp: "", matches: 0, runs: 0, wickets: 0, strikeRate: "", economy: "", achievements: "", bio: "", basePrice: 2000, status: "APPROVED" };
export function PlayerForm({ player, onClose }: { player: P | null; onClose: () => void }) {
  const [f, setF] = useState<Record<string, unknown>>(player ? { ...player, photoUrl: player.photoUrl ?? "" } : empty); const [busy, setBusy] = useState(false);
  const { push } = useToast();
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const I = ({ k, label, type = "text" }: { k: string; label: string; type?: string }) => <div><label className="label">{label}</label><input className="input" type={type} value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} /></div>;
  async function save() {
    setBusy(true);
    const body = Object.fromEntries(Object.entries(f).filter(([k]) => !["id", "soldPrice", "soldTo", "createdAt", "updatedAt", "queueOrder", "soldToId", "soldAt"].includes(k)).map(([k, v]) => [k, v === "" ? null : v]));
    if (player && ["LIVE", "SOLD"].includes(player.status)) delete body.status;
    const r = await fetch(player ? `/api/admin/players/${player.id}` : "/api/admin/players", { method: player ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return push({ title: "Save failed", body: j.error, tone: "error" });
    push({ title: "Player saved", tone: "success" }); onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card my-6 w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="display text-3xl">{player ? "Edit player" : "Add player"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Photo</label><ImageUpload value={(f.photoUrl as string) ?? ""} onChange={(u) => set("photoUrl", u)} /></div>
          <I k="name" label="Name" /><I k="age" label="Age" type="number" /><I k="phone" label="Phone" /><I k="email" label="Email" type="email" /><I k="hostelBlock" label="Hostel block" /><I k="roomNumber" label="Room" />
          <div><label className="label">Role</label><select className="input" value={f.role as string} onChange={(e) => set("role", e.target.value)}><option value="BATSMAN">Batsman</option><option value="BOWLER">Bowler</option><option value="ALL_ROUNDER">All-Rounder</option><option value="WICKETKEEPER">Wicketkeeper</option></select></div>
          <div><label className="label">Status</label><select className="input" value={f.status as string} disabled={!!player && ["LIVE", "SOLD"].includes(player.status)} onChange={(e) => set("status", e.target.value)}>{["REGISTERED","REJECTED","APPROVED","WAITING","UNSOLD","SKIPPED"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <I k="battingStyle" label="Batting style" /><I k="bowlingStyle" label="Bowling style" /><I k="experience" label="Experience" /><I k="basePrice" label="Base price (₹)" type="number" />
          <I k="matches" label="Matches" type="number" /><I k="runs" label="Runs" type="number" /><I k="wickets" label="Wickets" type="number" /><I k="strikeRate" label="Strike rate" type="number" /><I k="economy" label="Economy" type="number" />
          <div className="sm:col-span-2"><label className="label">Previous experience</label><textarea className="input" rows={2} value={(f.previousExp as string) ?? ""} onChange={(e) => set("previousExp", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Achievements</label><textarea className="input" rows={2} value={(f.achievements as string) ?? ""} onChange={(e) => set("achievements", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Bio</label><textarea className="input" rows={2} value={(f.bio as string) ?? ""} onChange={(e) => set("bio", e.target.value)} /></div>
        </div>
        <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-gold" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button></div>
      </div>
    </div>
  );
}
