export function toYYYYMMDD(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^\d{8}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  return `${y}${m}${day}`;
}

export async function getJSON<T=any>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "accept": "application/json" } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstream ${res.status} ${res.statusText}: ${text.slice(0,200)}`);
  }
  return res.json() as Promise<T>;
}