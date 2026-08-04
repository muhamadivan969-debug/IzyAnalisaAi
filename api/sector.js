const SECTOR_STOCKS = require("../sectors-data.js");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name } = req.query;
  const apiKey = process.env.GOAPI_KEY;
  const BASE = "https://api.goapi.io/stock/idx";
  const headers = { "X-API-KEY": apiKey, "Accept": "application/json" };

  if (!name || !SECTOR_STOCKS[name]) {
    return res.status(400).json({
      error: "Sektor tidak dikenali",
      availableSectors: Object.keys(SECTOR_STOCKS)
    });
  }

  const stockList = SECTOR_STOCKS[name];
  const symbols = stockList.map(s => s.symbol);

  const normalize = (r) => ({
    kode: r.symbol || r.ticker || "",
    close: Number(r.close || r.last_price || 0),
    open: Number(r.open || 0),
    changePercent: Number(r.change_pct || r.percent || 0)
  });

  try {
    const r = await fetch(`${BASE}/prices?symbols=${symbols.join(",")}`, { headers });
    const j = await r.json();
    const results = j.data?.results || [];

    const priceMap = {};
    results.map(normalize).forEach(item => {
      if (item.kode) priceMap[item.kode] = item;
    });

    const merged = stockList.map(s => {
      const p = priceMap[s.symbol];
      return {
        symbol: s.symbol,
        name: s.name,
        close: p ? p.close : 0,
        changePercent: p ? p.changePercent : 0,
        available: !!p && p.close > 0
      };
    });

    return res.status(200).json({ sector: name, data: merged });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
