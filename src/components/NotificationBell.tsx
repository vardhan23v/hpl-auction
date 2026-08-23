"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { useToast } from "./Toast";

type N = { id: string; title: string; message: string; read: boolean; createdAt: string; type: string };
export function NotificationBell() {
  const [list, setList] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  const { push } = useToast();
  const load = () => fetch("/api/notifications").then((r) => r.json()).then(setList).catch(() => {});
  useEffect(() => {
    load();
    const s = getSocket();
    const refetch = () => load();
    ["auction:started","auction:paused","auction:resumed","auction:completed","player:sold","player:unsold"].forEach((e) => s.on(e, refetch));
    s.on("bid:accepted", refetch);
    return () => { ["auction:started","auction:paused","auction:resumed","auction:completed","player:sold","player:unsold","bid:accepted"].forEach((e) => s.off(e, refetch)); };
  }, []);
  useEffect(() => {
    const s = getSocket();
    const h = (e: string, title: string) => s.on(e, () => push({ title, tone: "gold" }));
    h("auction:started", "Auction started"); h("auction:paused", "Auction paused"); h("auction:resumed", "Auction resumed"); h("auction:completed", "Auction completed");
    return () => { ["auction:started","auction:paused","auction:resumed","auction:completed"].forEach((e) => s.off(e)); };
  }, [push]);
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) fetch("/api/notifications", { method: "POST" }).then(load); }} className="relative rounded-md px-2 py-1.5 hover:bg-panel-2" aria-label="Notifications">
        🔔{unread > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-live px-1.5 text-[10px] font-bold">{unread}</span>}
      </button>
      {open && (
        <div className="glass absolute right-0 mt-2 max-h-96 w-80 overflow-auto rounded-xl p-2 shadow-2xl">
          {list.length === 0 && <div className="p-3 text-sm text-muted">No notifications yet.</div>}
          {list.map((n) => (
            <div key={n.id} className="border-b border-line/50 p-2 last:border-0">
              <div className="text-sm font-semibold">{n.title}</div>
              <div className="text-xs text-muted">{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
