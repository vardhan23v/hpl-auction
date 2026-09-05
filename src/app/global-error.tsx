"use client";
/** Last-resort boundary for errors thrown by the root layout itself. Must render its own <html>/<body>; global CSS may not be available, so styles are inline. */
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Auto-recover: once /api/health reports OK, reload the page.
  useEffect(() => {
    const t = setInterval(async () => {
      try { const r = await fetch("/api/health", { cache: "no-store" }); if (r.ok) window.location.reload(); } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, []);
  const S = { bg: "#07090f", ink: "#e8ecf5", muted: "#8b95ad", gold: "#f5b82e", red: "#ff2e4d", line: "#1f2a44" };
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.bg, color: S.ink, fontFamily: "Inter, system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <div style={{ fontFamily: "Oswald, Impact, sans-serif", textTransform: "uppercase", fontSize: 56, fontWeight: 700, color: S.red, lineHeight: 1 }}>Rain stopped play</div>
          <p style={{ color: S.muted, maxWidth: 520, margin: "16px auto 0", fontSize: 17 }}>The app hit an error it couldn&rsquo;t recover from. If the server is restarting, this page reloads itself once it&rsquo;s back.</p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={reset} style={{ background: S.gold, color: "#000", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
            <button onClick={() => window.location.reload()} style={{ background: "transparent", color: S.ink, border: `1px solid ${S.line}`, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>Reload</button>
          </div>
          {error?.digest && <p style={{ marginTop: 28, fontFamily: "monospace", fontSize: 11, color: S.muted, opacity: 0.6 }}>ref {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
