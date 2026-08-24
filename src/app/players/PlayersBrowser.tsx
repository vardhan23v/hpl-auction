"use client";
import { useState } from "react";
import { inr, ROLE_LABEL } from "@/lib/format";

export type PubPlayer = { id: string; name: string; photoUrl: string | null; role: string; battingStyle: string | null; bowlingStyle: string | null; age: number | null; hostelBlock: string | null; matches: number; runs: number; wickets: number; basePrice: number; status: string; soldPrice: number | null; soldTo: { name: string; color: string } | null };

const TABS = [["", "All"], ["UPCOMING", "Upcoming"], ["SOLD", "Sold"], ["UNSOLD", "Unsold"]] as const;

export function PlayersBrowser({ players }: { players: PubPlayer[] }) {
  const [q, setQ] = useState(""); const [role, setRole] = useState(""); const [tab, setTab] = useState("");
  const upcoming = (s: string) => ["APPROVED", "WAITING", "LIVE"].includes(s);
  const list = players.filter((p) =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
    (!role || p.role === role) &&
    (!tab || (tab === "UPCOMING" ? upcoming(p.status) : p.status === tab)));
  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">{TABS.map(([v, l]) => <button key={v} onClick={() => setTab(v)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${tab === v ? "bg-gold text-black" : "bg-panel-2 text-muted hover:text-ink"}`}>{l}</button>)}</div>
        <input className="input w-52" placeholder="Search player…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-44" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <span className="ml-auto text-sm text-muted">{list.length} shown</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((p) => (
          <div key={p.id} className={`card overflow-hidden transition hover:border-gold/50 ${p.status === "LIVE" ? "ring-2 ring-live" : ""}`}>
            <div className="relative aspect-square bg-panel-2">
              {p.photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photoUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="display flex h-full items-center justify-center text-6xl text-muted/30">{p.name[0]}</div>}
              {p.status === "LIVE" && <span className="absolute left-2 top-2 rounded bg-live px-2 py-0.5 text-[10px] font-bold text-white"><span className="live-dot mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white" />ON THE BLOCK</span>}
              {p.status === "SOLD" && <span className="absolute left-2 top-2 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-black">SOLD</span>}
              {p.status === "UNSOLD" && <span className="absolute left-2 top-2 rounded bg-zinc-600 px-2 py-0.5 text-[10px] font-bold text-white">UNSOLD</span>}
            </div>
            <div className="p-3">
              <div className="truncate font-bold">{p.name}</div>
              <div className="text-xs text-muted">{ROLE_LABEL[p.role]}{p.battingStyle ? ` · ${p.battingStyle.replace("-hand bat", "")}` : ""}{p.hostelBlock ? ` · Blk ${p.hostelBlock}` : ""}</div>
              <div className="mt-2 flex items-center justify-between text-sm">
                {p.status === "SOLD" ? (
                  <><span className="money font-bold">{inr(p.soldPrice)}</span><span className="truncate text-xs font-semibold" style={{ color: p.soldTo?.color }}>{p.soldTo?.name}</span></>
                ) : (
                  <><span className="text-xs text-muted">Base</span><span className="money font-bold">{inr(p.basePrice)}</span></>
                )}
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="col-span-full py-16 text-center text-muted">No players match.</div>}
      </div>
    </>
  );
}
