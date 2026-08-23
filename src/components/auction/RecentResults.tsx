"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { inr, ROLE_LABEL } from "@/lib/format";
type Row = { id: string; name: string; role: string; status: string; basePrice: number; soldPrice: number | null; soldTo: { name: string; color: string } | null };
export function RecentResults() {
  const [rows, setRows] = useState<Row[]>([]);
  const load = () => fetch("/api/public/recent").then((r) => r.json()).then(setRows).catch(() => {});
  useEffect(() => { load(); const s = getSocket(); ["player:sold","player:unsold","auction:undo","state:sync"].forEach((e) => s.on(e, load)); return () => { ["player:sold","player:unsold","auction:undo","state:sync"].forEach((e) => s.off(e, load)); }; }, []);
  return (
    <div className="card p-4">
      <h3 className="display mb-2 text-lg">Recent Results</h3>
      <div className="flex max-h-[420px] flex-col gap-1.5 overflow-auto">
        {rows.length === 0 && <div className="py-6 text-center text-sm text-muted">No players sold yet.</div>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg bg-panel-2 px-3 py-2 text-sm">
            <div><div className="font-semibold">{r.name}</div><div className="text-[11px] text-muted">{ROLE_LABEL[r.role]} · base {inr(r.basePrice)}</div></div>
            {r.status === "SOLD" ? <div className="text-right"><div className="money font-bold">{inr(r.soldPrice)}</div><div className="text-[11px] font-semibold" style={{ color: r.soldTo?.color }}>{r.soldTo?.name}</div></div> : <span className="rounded bg-live/20 px-2 py-0.5 text-xs font-bold text-live">UNSOLD</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
