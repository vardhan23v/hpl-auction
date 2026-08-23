/** Indian-style currency formatting: 100000 -> ₹1,00,000 */
export function inr(n: number | null | undefined): string {
  if (n == null) return "₹0";
  const s = Math.abs(Math.round(n)).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return (n < 0 ? "-" : "") + "₹" + formatted;
}

export const ROLE_LABEL: Record<string, string> = {
  BATSMAN: "Batsman",
  BOWLER: "Bowler",
  ALL_ROUNDER: "All-Rounder",
  WICKETKEEPER: "Wicketkeeper",
};

export function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
