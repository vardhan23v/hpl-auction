"use client";
import { useToast } from "@/components/Toast";
export function ResetButton() {
  const { push } = useToast();
  return <button className="btn-ghost text-live" onClick={async () => { if (!confirm("RESET the auction? All sales, bids and purses will be reset. Players stay approved.")) return; if (!confirm("Are you absolutely sure?")) return; const r = await fetch("/api/auction/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "RESET_AUCTION" }) }); push({ title: r.ok ? "Auction reset" : "Failed", tone: r.ok ? "success" : "error" }); }}>⚠ Reset auction (danger)</button>;
}
