"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
type U = { id: string; name: string; email: string; role: string; teamId: string | null; team: { name: string } | null };
export function UsersTable({ teams }: { teams: { id: string; name: string }[] }) {
  const [users, setUsers] = useState<U[]>([]); const [f, setF] = useState({ name: "", email: "", password: "", role: "SPECTATOR", teamId: "" }); const { push } = useToast();
  const load = () => fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);
  async function create() { const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, teamId: f.teamId || null }) }); const j = await r.json(); push({ title: r.ok ? "User created" : "Failed", body: j.error, tone: r.ok ? "success" : "error" }); if (r.ok) { setF({ name: "", email: "", password: "", role: "SPECTATOR", teamId: "" }); load(); } }
  async function resetPw(u: U) { const p = prompt(`New password for ${u.email}`); if (!p) return; const r = await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: p }) }); push({ title: r.ok ? "Password updated" : "Failed", tone: r.ok ? "success" : "error" }); }
  async function del(u: U) { if (!confirm(`Delete ${u.email}?`)) return; const r = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" }); push({ title: r.ok ? "Deleted" : "Failed", tone: r.ok ? "success" : "error" }); load(); }
  return (
    <div><h1 className="display text-4xl">Users</h1>
      <div className="card mt-4 grid gap-2 p-4 sm:grid-cols-6">
        <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><input className="input" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><input className="input" placeholder="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{["ADMIN","AUCTIONEER","CAPTAIN","SPECTATOR"].map((r) => <option key={r}>{r}</option>)}</select>
        <select className="input" value={f.teamId} disabled={f.role !== "CAPTAIN"} onChange={(e) => setF({ ...f, teamId: e.target.value })}><option value="">No team</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button className="btn-gold" onClick={create}>Add user</button>
      </div>
      <div className="card mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-panel-2 text-left text-xs uppercase text-muted"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Team</th><th className="p-3 text-right">Actions</th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id} className="border-t border-line/50"><td className="p-3 font-semibold">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.role}</td><td className="p-3">{u.team?.name ?? "—"}</td><td className="p-3 text-right"><button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => resetPw(u)}>Reset password</button> <button className="btn-ghost !px-2 !py-1 text-xs text-live" onClick={() => del(u)}>Delete</button></td></tr>)}</tbody></table></div>
    </div>
  );
}
