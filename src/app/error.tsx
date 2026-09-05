"use client";
/** Route error boundary. Production strips error messages, so we probe /api/health to tell "server/database down" apart from a genuine bug — and auto-recover when the server comes back. */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Health = "checking" | "down" | "up";
const POLL_MS = 4000;

async function probe(): Promise<Health> {
  try {
    const r = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(6000) });
    const j = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    return r.ok && j?.ok ? "up" : "down";
  } catch { return "down"; }
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [health, setHealth] = useState<Health>("checking");
  const [checks, setChecks] = useState(0);
  const everDown = useRef(false);
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Server-side errors need a fresh RSC payload: refresh the route, then reset the boundary (reset() alone replays the cached failure).
  const recover = () => startTransition(() => { router.refresh(); reset(); });

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const h = await probe();
      if (!alive) return;
      setChecks((c) => c + 1);
      setHealth(h);
      if (h === "down") everDown.current = true;
      else if (everDown.current) { everDown.current = false; recover(); } // server is back → re-render the route automatically
    };
    run();
    const t = setInterval(run, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const down = health === "down";
  return (
    <main className="stadium relative flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <span className={`mb-5 inline-block h-3.5 w-3.5 rounded-full ${down ? "live-dot bg-live" : health === "up" ? "bg-gold" : "animate-pulse bg-muted"}`} />
      <div className={`display text-5xl font-bold md:text-7xl ${down ? "text-live" : "text-gold"}`}>
        {down ? "Server unreachable" : health === "checking" ? "Checking the pitch…" : "Something broke"}
      </div>
      <p className="mt-4 max-w-xl text-muted md:text-lg">
        {down
          ? "The auction server or its database isn't responding. It may be restarting or waking from sleep — this page will recover on its own as soon as it's back."
          : health === "checking" ? "Finding out whether the server is up." : "A wild delivery. The server is up, so this is a one-off — try again. The auction state is safe on the server."}
      </p>
      <div className="mt-6 flex items-center gap-3 rounded-full border border-line bg-panel/80 px-4 py-2 text-sm tabular-nums text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-gold" />
        {down ? `Retrying every ${POLL_MS / 1000}s · check ${checks}` : health === "checking" ? "Contacting /api/health…" : "Server online"}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={recover} className="btn-gold">Try again</button>
        <button onClick={() => window.location.reload()} className="btn-ghost">Reload page</button>
        <Link href="/" className="btn-ghost">Home</Link>
      </div>
      {error?.digest && <p className="mt-8 font-mono text-[11px] text-muted/60">ref {error.digest}</p>}
    </main>
  );
}
