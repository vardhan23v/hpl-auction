export function TeamBadge({ name, abbreviation, color, logoUrl, size = 40 }: { name: string; abbreviation: string; color: string; logoUrl?: string | null; size?: number }) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size, boxShadow: `0 0 0 2px ${color}` }} />
  ) : (
    <div className="display flex items-center justify-center rounded-full font-bold text-black" style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}>{abbreviation}</div>
  );
}
