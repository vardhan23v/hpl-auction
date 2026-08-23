"use client";
import { useEffect, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/components/Toast";
import { inr, ROLE_LABEL } from "@/lib/format";
import { getSocket } from "@/lib/socket-client";
type Q = { id: string; name: string; role: string; basePrice: number; status: string; hostelBlock: string | null };

function Row({ p, i, onStart, onSkipTop }: { p: Q; i: number; onStart: () => void; onSkipTop: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: p.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 p-2">
      <button {...attributes} {...listeners} className="cursor-grab px-2 text-muted" aria-label="drag">⋮⋮</button>
      <div className="w-7 text-center text-xs text-muted">{i + 1}</div>
      <div className="flex-1"><div className="font-semibold">{p.name}</div><div className="text-xs text-muted">{ROLE_LABEL[p.role]} · base {inr(p.basePrice)} · {p.status}</div></div>
      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={onSkipTop}>Move to end</button>
      <button className="btn-gold !px-2 !py-1 text-xs" onClick={onStart}>Start now</button>
    </div>
  );
}

export function QueueBoard() {
  const [list, setList] = useState<Q[]>([]); const [q, setQ] = useState(""); const [role, setRole] = useState(""); const [maxBase, setMaxBase] = useState(""); const [total, setTotal] = useState(100);
  const { push } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const load = () => fetch("/api/admin/players/queue").then((r) => r.json()).then(setList);
  useEffect(() => { load(); fetch("/api/admin/settings").then((r) => r.json()).then((s) => setTotal(s.maxPlayers)); const s = getSocket(); const f = () => load(); ["player:started","player:sold","player:unsold","player:skipped","state:sync"].forEach((e) => s.on(e, f)); return () => { ["player:started","player:sold","player:unsold","player:skipped","state:sync"].forEach((e) => s.off(e, f)); }; }, []);
  async function persist(next: Q[]) { setList(next); const r = await fetch("/api/admin/players/queue", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.map((p) => p.id) }) }); if (!r.ok) push({ title: "Reorder failed", tone: "error" }); }
  function onDragEnd(e: DragEndEvent) { const { active, over } = e; if (!over || active.id === over.id) return; const a = list.findIndex((p) => p.id === active.id), b = list.findIndex((p) => p.id === over.id); persist(arrayMove(list, a, b)); }
  async function start(id: string) { const r = await fetch("/api/auction/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "START_PLAYER", playerId: id }) }); const j = await r.json(); push({ title: r.ok ? "Player is live" : "Failed", body: j.error, tone: r.ok ? "success" : "error" }); }
  const visible = list.filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!role || p.role === role) && (!maxBase || p.basePrice <= Number(maxBase)));
  const filtering = q || role || maxBase;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2"><h1 className="display mr-auto text-4xl">Auction Queue</h1><div className="display text-xl text-gold">Players Remaining: {list.length} / {total}</div></div>
      <div className="mt-3 flex flex-wrap gap-2"><input className="input w-48" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /><select className="input w-40" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input className="input w-40" placeholder="Max base price" inputMode="numeric" value={maxBase} onChange={(e) => setMaxBase(e.target.value.replace(/\D/g, ""))} /></div>
      {filtering && <div className="mt-2 text-xs text-muted">Drag-to-reorder is disabled while filtering.</div>}
      <div className="mt-4 flex flex-col gap-1.5">
        {list.length === 0 && <div className="card p-8 text-center text-muted">Queue is empty. Approve players to add them.</div>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={filtering ? undefined : onDragEnd}>
          <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {visible.map((p, i) => <Row key={p.id} p={p} i={list.indexOf(p)} onStart={() => start(p.id)} onSkipTop={() => persist([...list.filter((x) => x.id !== p.id), p])} />)}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
