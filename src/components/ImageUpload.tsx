"use client";
import { useState } from "react";
export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setBusy(true); setErr(null);
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd }); const j = await r.json();
    setBusy(false); if (!r.ok) return setErr(j.error ?? "Upload failed"); onChange(j.url);
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="h-20 w-20 overflow-hidden rounded-xl border border-line bg-panel-2">{value && /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-full w-full object-cover" />}</div>
      <div className="min-w-0 flex-1"><input type="file" accept="image/*" onChange={pick} className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-panel-2 file:px-3 file:py-1.5 file:text-ink" />{busy && <div className="text-xs text-muted">Uploading…</div>}{err && <div className="text-xs text-live">{err}</div>}</div>
    </div>
  );
}
