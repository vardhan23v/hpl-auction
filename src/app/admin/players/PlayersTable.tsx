"use client";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { inr, ROLE_LABEL } from "@/lib/format";
import { PlayerForm, type P } from "./PlayerForm";

export function PlayersTable({ title, fixedStatus }: { title: string; fixedStatus?: string }) {
  const [rows, setRows] = useState<P[]>([]); const [q, setQ] = useState(""); const [status, setStatus] = useState(fixedStatus ?? ""); const [role, setRole] = useState("");
  const [edit, setEdit] = useState<P | null | "new">(null); const [loading, setLoading] = useState(true);
  const { push } = useToast();
  const load = useCallback(async () => { setLoading(true); const u = new URLSearchParams({ q, status, role }); const r = await fetch(`/api/admin/players?${u}`); setRows(await r.json()); setLoading(false); }, [q, status, role]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  async function patch(id: string, body: object, msg: string) {
    const r = await fetch(`/api/admin/players/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); push({ title: r.ok ? msg : "Failed", body: r.ok ? undefined : j.error, tone: r.ok ? "success" : "error" }); load();
  }
  async function del(p: P) { if (!confirm(`Delete ${p.name}?`)) return; const r = await fetch(`/api/admin/players/${p.id}`, { method: "DELETE" }); push({ title: r.ok ? "Deleted" : "Failed", tone: r.ok ? "success" : "error" }); load(); }
  async function requeue(p: P) { const r = await fetch("/api/auction/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "REQUEUE", playerId: p.id }) }); const j = await r.json(); push({ title: r.ok ? "Back in queue" : "Failed", body: j.error, tone: r.ok ? "success" : "error" }); load(); }
  const badge: Record<string, string> = { REGISTERED: "bg-sky-500/20 text-sky-300", REJECTED: "bg-zinc-500/20 text-zinc-300", APPROVED: "bg-emerald-500/20 text-emerald-300", WAITING: "bg-gold/20 text-gold", LIVE: "bg-live/20 text-live", SOLD: "bg-emerald-500/30 text-emerald-300", UNSOLD: "bg-live/20 text-live", SKIPPED: "bg-zinc-500/20 text-zinc-300" };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2"><h1 className="display mr-auto text-4xl">{title}</h1>
        <input className="input w-48" placeholder="Search name…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!fixedStatus && <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.keys(badge).map((s) => <option key={s}>{s}</option>)}</select>}
        <select className="input w-40" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn-gold" onClick={() => setEdit("new")}>+ Add player</button></div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-panel-2 text-left text-xs uppercase text-muted"><tr><th className="p-3">Player</th><th className="p-3">Role</th><th className="p-3">Stats</th><th className="p-3">Base</th><th className="p-3">Status</th><th className="p-3">Sold</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody>
            {loading && rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">No players found.</td></tr>}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-line/50">
                <td className="p-3"><div className="flex items-center gap-2">{p.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-2 text-xs">{p.name[0]}</div>}<div><div className="font-semibold">{p.name}</div><div className="text-xs text-muted">{p.email} · Block {p.hostelBlock ?? "—"}</div></div></div></td>
                <td className="p-3">{ROLE_LABEL[p.role]}</td><td className="p-3 text-xs text-muted">{p.matches}m · {p.runs}r · {p.wickets}w</td><td className="p-3">{inr(p.basePrice)}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-bold ${badge[p.status]}`}>{p.status}</span></td>
                <td className="p-3">{p.soldPrice ? <span className="money">{inr(p.soldPrice)} <span className="text-xs" style={{ color: p.soldTo?.color }}>{p.soldTo?.name}</span></span> : "—"}</td>
                <td className="p-3"><div className="flex flex-wrap justify-end gap-1">
                  {p.status === "REGISTERED" && <><button className="btn-green !px-2 !py-1 text-xs" onClick={() => patch(p.id, { status: "APPROVED" }, "Approved")}>Approve</button><button className="btn-red !px-2 !py-1 text-xs" onClick={() => patch(p.id, { status: "REJECTED" }, "Rejected")}>Reject</button></>}
                  {p.status === "REJECTED" && <button className="btn-green !px-2 !py-1 text-xs" onClick={() => patch(p.id, { status: "APPROVED" }, "Approved")}>Approve</button>}
                  {(p.status === "UNSOLD" || p.status === "SKIPPED") && <button className="btn-gold !px-2 !py-1 text-xs" onClick={() => requeue(p)}>Re-queue</button>}
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => setEdit(p)}>Edit</button>
                  {!["LIVE", "SOLD"].includes(p.status) && <button className="btn-ghost !px-2 !py-1 text-xs text-live" onClick={() => del(p)}>Delete</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <PlayerForm player={edit === "new" ? null : edit} onClose={() => { setEdit(null); load(); }} />}
    </div>
  );
}
