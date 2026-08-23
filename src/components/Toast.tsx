"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; title: string; body?: string; tone?: "info" | "success" | "error" | "gold" };
const Ctx = createContext<{ push: (t: Omit<Toast, "id">) => void }>({ push: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-4), { ...t, id }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 4000);
  }, []);
  const tone = { info: "border-line", success: "border-emerald-500/60", error: "border-live/70", gold: "border-gold/70" };
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
        {list.map((t) => (
          <div key={t.id} className={`glass pointer-events-auto rounded-xl border-l-4 p-3 shadow-2xl bid-new ${tone[t.tone ?? "info"]}`}>
            <div className="text-sm font-semibold">{t.title}</div>
            {t.body && <div className="text-xs text-muted">{t.body}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
