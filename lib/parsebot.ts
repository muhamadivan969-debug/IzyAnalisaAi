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

function extractSparkFromRaw(raw: any): number[] | undefined {
  if (!raw) return undefined;
  // common fields that might hold a series of closes
  const candidates = [
    raw.sparkline,
    raw.spark,
    raw.prices,
    raw.history,
    raw.close_history,
    raw.price_series,
    raw.series,
    raw.chart?.close,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      // array of numbers or array of objects
      if (c.length === 0) continue;
      if (typeof c[0] === 'number') return c.map((n: any) => Number(n) || 0);
      if (typeof c[0] === 'object') {
        // try to map to close values
        const mapped = c.map((it: any) => {
          if (it == null) return 0;
          if (typeof it === 'number') return Number(it);
          return numberOrNull(it.close ?? it.c ?? it.price ?? it.last) ?? 0;
        });
        return mapped;
      }
    }
  }
  return undefined;
}

function extractOhlcFromRaw(raw: any): Array<{time:string, open:number, high:number, low:number, close:number}> | undefined {
  if (!raw) return undefined;
  // common fields that might hold OHLC arrays
  const candidates = [raw.ohlc, raw.candles, raw.historical, raw.chart?.ohlc, raw.price_history];
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c) && c.length > 0) {
      // each item might be [time, open, close, low, high] or {t,o,h,l,c} or [o,h,l,c]
      const first = c[0];
      if (Array.isArray(first)) {
        // try patterns
        if (first.length >= 4) {
          // detect if first element is time string
          if (typeof first[0] === 'string' || typeof first[0] === 'number') {
            // assume [time, open, high, low, close] or [open, close, low, high]
            return c.map((it: any) => {
              if (typeof it[0] === 'string' || typeof it[0] === 'number') {
                // [time, open, high, low, close] -> try to detect order
                if (it.length >= 5) return { time: String(it[0]), open: Number(it[1]||0), high: Number(it[2]||0), low: Number(it[3]||0), close: Number(it[4]||0) };
                // fallback: [time, close]
                return { time: String(it[0]), open: Number(it[1]||0), high: Number(it[1]||0), low: Number(it[1]||0), close: Number(it[1]||0) };
              }
              return null;
            }).filter(Boolean) as any;
          }
          // else arrays of numbers [open, close, low, high]
          return c.map((it: any, idx: number) => ({ time: String(idx), open: Number(it[0]||0), high: Number(it[2]||0), low: Number(it[3]||0), close: Number(it[1]||0) }));
        }
      } else if (typeof first === 'object') {
        // objects with keys
        return c.map((it: any) => ({ time: String(it.time ?? it.t ?? it.date ?? it.datetime ?? it[0] ?? ''), open: Number(it.open ?? it.o ?? it.O ?? 0), high: Number(it.high ?? it.h ?? 0), low: Number(it.low ?? it.l ?? 0), close: Number(it.close ?? it.c ?? it.C ?? it.price ?? 0) }));
      }
    }
  }
  return undefined;
}

function normalizeStock(s: any) {
  // Try several common field names
  const kode = s.kode || s.code || s.symbol || s.symbols || s.ticker || s["symbol"] || s["kode"] || s["code"];
  const name = s.name || s.company_name || s.title || s["company"] || s["name"];
  const close = numberOrNull(s.close ?? s.last ?? s.last_price ?? s.price ?? s.close_price ?? s.lastPrice ?? s.C ?? s.c);
  const changePercent = numberOrNull(s.changePercent ?? s.change_percent ?? s.change ?? s.p_change ?? s.percent ?? s.change_pct ?? s.P ?? s.pct);

  // try to extract sparkline and ohlc from raw fields
  const raw = s;
  const spark = extractSparkFromRaw(raw);
  const chartData = extractOhlcFromRaw(raw);

  return {
    kode: String(kode || "").toUpperCase(),
    name: name || "",
    close: close ?? 0,
    changePercent: changePercent ?? 0,
    spark,
    chartData,
    raw: s,
  };
}

async function parsebotGet(path: string, query?: Record<string, string | number>) {
  const key = process.env.PARSE_API_KEY || process.env.PARSEBOT_API_KEY || process.env.PARSE_BOT_KEY;
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

  // if no spark present, attempt to augment with simple mock small series based on close
  const enriched = normalized.map(s => {
    if (!s.spark || s.spark.length < 5) {
      const base = Number(s.close || 0);
      s.spark = Array.from({ length: 20 }).map((_, i) => Math.max(0, Math.round((base * (1 + (Math.sin(i) * 0.002 + (i % 2 ? 0.001 : -0.001)))))));
    }
    if (!s.chartData || s.chartData.length < 5) {
      // generate simple OHLC mock around close
      const base = Number(s.close || 1000);
      const data = Array.from({ length: 30 }).map((_, i) => {
        const t = `${i}`;
        const open = Math.round(base * (1 + Math.sin(i + 1) * 0.005));
        const close = Math.round(base * (1 + Math.sin(i) * 0.005));
        const high = Math.max(open, close) + Math.round(base * 0.002);
        const low = Math.min(open, close) - Math.round(base * 0.002);
        return { time: t, open, high, low, close };
      });
      s.chartData = data;
    }
    return s;
  });

  setCache(cacheKey, enriched, Number(process.env.PARSE_CACHE_TTL ?? 60));
  return enriched;
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
  try {
    const fallbackId = process.env.PARSE_STOCK_DETAIL_SCRAPER_ID;
    if (fallbackId) {
      const json = await parsebotGet(`/scraper/${fallbackId}/get`, { q: kode });
      const arr = Array.isArray(json) ? json : json?.data || json?.result || [];
      if (Array.isArray(arr) && arr.length > 0) {
        const s = normalizeStock(arr[0]);
        if (!s.spark) s.spark = Array.from({ length: 20 }).map(() => 0);
        if (!s.chartData) s.chartData = [];
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
