const DEFAULT_BASE = "https://api.parse.bot";

type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<any>>();

function setCache<T>(key: string, value: T, ttl = 60) {
  cache.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function getCache<T>(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cache.delete(key);
    return null;
  }
  return e.value as T;
}

function numberOrNull(v: any) {
  if (v == null) return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizeStock(s: any) {
  // Try several common field names
  const kode = s.kode || s.code || s.symbol || s.symbols || s.ticker || s["symbol"] || s["kode"] || s["code"];
  const name = s.name || s.company_name || s.title || s["company"] || s["name"];
  const close = numberOrNull(s.close ?? s.last ?? s.last_price ?? s.price ?? s.close_price ?? s.lastPrice);
  const changePercent = numberOrNull(s.changePercent ?? s.change_percent ?? s.change ?? s.p_change ?? s.percent ?? s.change_pct);

  return {
    kode: String(kode || "").toUpperCase(),
    name: name || "",
    close: close ?? 0,
    changePercent: changePercent ?? 0,
    raw: s,
  };
}

async function parsebotGet(path: string, query?: Record<string, string | number>) {
  const key = process.env.PARSE_API_KEY || process.env.PARSEBOT_API_KEY;
  if (!key) throw new Error("NO_PARSE_KEY");

  const base = process.env.PARSEBOT_BASE_URL || DEFAULT_BASE;
  const url = new URL(path, base);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const headers: Record<string, string> = {
    "X-API-Key": key,
  };
  // Optional snapshot version header
  if (process.env.PARSE_API_SNAPSHOT_VERSION) {
    headers["API-Snapshot-Version"] = String(process.env.PARSE_API_SNAPSHOT_VERSION);
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Parse.bot error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json;
}

// Example: use a known scraper id that returns a market stock list; allow override via env
const STOCK_LIST_SCRAPER_ID = process.env.PARSE_STOCK_LIST_SCRAPER_ID || "3344e652-0a91-4a3c-96f6-d64b4d7f7369";

export async function fetchStockList(board = "Utama") {
  const cacheKey = `stock_list:${STOCK_LIST_SCRAPER_ID}:${board}`;
  const cached = getCache<any[]>(cacheKey);
  if (cached) return cached;

  const path = `/scraper/${STOCK_LIST_SCRAPER_ID}/get_stock_list`;
  const json = await parsebotGet(path, { board });

  // Attempt to find the array in typical fields
  let items: any[] = [];
  if (Array.isArray(json)) items = json as any[];
  else if (Array.isArray(json?.data)) items = json.data;
  else if (Array.isArray(json?.stocks)) items = json.stocks;
  else if (Array.isArray(json?.result)) items = json.result;
  else if (json && typeof json === "object") {
    // collect arrays in object and pick the largest
    const arrays = Object.values(json).filter(v => Array.isArray(v)) as any[];
    if (arrays.length > 0) items = arrays.reduce((a, b) => (a.length > b.length ? a : b));
  }

  const normalized = items.map(normalizeStock).filter(s => s.kode);
  setCache(cacheKey, normalized, Number(process.env.PARSE_CACHE_TTL ?? 60));
  return normalized;
}

export async function fetchStockByCode(kode: string) {
  const cacheKey = `stock:${kode}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;

  const list = await fetchStockList();
  const found = list.find(s => s.kode === kode.toUpperCase() || String(s.kode).toUpperCase() === kode.toUpperCase());
  if (found) {
    setCache(cacheKey, found, 60);
    return found;
  }

  // If not found, try a best-effort call to a different scraper path (not guaranteed)
  // Some parse.bot setups expose /scraper/{id}/get for detail; try a generic get?q=kode
  try {
    const fallbackId = process.env.PARSE_STOCK_DETAIL_SCRAPER_ID;
    if (fallbackId) {
      const json = await parsebotGet(`/scraper/${fallbackId}/get`, { q: kode });
      const arr = Array.isArray(json) ? json : json?.data || json?.result || [];
      if (Array.isArray(arr) && arr.length > 0) {
        const s = normalizeStock(arr[0]);
        setCache(cacheKey, s, 60);
        return s;
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

export async function fetchTopPicks() {
  const cacheKey = `top_picks`;
  const cached = getCache<any[]>(cacheKey);
  if (cached) return cached;

  // For top picks, reuse stock list and pick top N by changePercent
  const list = await fetchStockList();
  const sorted = [...list].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  const top = sorted.slice(0, Number(process.env.TOP_PICKS_COUNT ?? 5));
  setCache(cacheKey, top, Number(process.env.PARSE_CACHE_TTL ?? 60));
  return top;
}

export async function fetchSector(name: string) {
  const cacheKey = `sector:${name.toLowerCase()}`;
  const cached = getCache<any[]>(cacheKey);
  if (cached) return cached;

  // Try to get full list and filter by sector property
  const list = await fetchStockList();
  const filtered = list.filter(s => {
    const raw = s.raw || {};
    const sector = String(raw.sector || raw.industry || raw.sektor || "").toLowerCase();
    return sector.includes(name.toLowerCase()) || String(s.name).toLowerCase().includes(name.toLowerCase());
  });

  // If none matched, fallback to first N items
  const result = filtered.length > 0 ? filtered : list.slice(0, 10);
  setCache(cacheKey, result, Number(process.env.PARSE_CACHE_TTL ?? 60));
  return result;
}
