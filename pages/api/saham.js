const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSEBOT_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { kode } = req.query;
  if (!kode) return res.status(400).json({ error: "Parameter 'kode' wajib" });
  if (!API_KEY) return res.status(500).json({ error: "API Key belum diatur" });

  try {
    const target = kode.toUpperCase();

    // Khusus IHSG
    if (target === "COMPOSITE" || target === "IHSG") {
      const indexRes = await fetch(`${PARSE_BASE}/get_market_index_summary`, {
        headers: { "X-API-Key": API_KEY },
      });
      const indexJson = await indexRes.json();
      const list = indexJson?.data || indexJson || [];
      const ihsg = list.find(i => (i.IndexCode || i.Code || "").toUpperCase() === "COMPOSITE");

      if (!ihsg) return res.status(404).json({ error: "IHSG tidak ditemukan" });

      const close = Number(ihsg.LastVal || ihsg.Close || 0);
      const prev = Number(ihsg.PrevVal || close);
      const changePercent = prev ? ((close - prev) / prev) * 100 : 0;

      return res.status(200).json({
        data: {
          close,
          open: Number(ihsg.OpenVal || close),
          high: Number(ihsg.HighVal || close),
          low: Number(ihsg.LowVal || close),
          volume: 0,
          changePercent: Number(changePercent.toFixed(2)),
          kode: "COMPOSITE",
          name: "IHSG",
        }
      });
    }

    // Tarik 10 halaman paralel agar pencarian tidak lag [1]
    const pages = 10;
    const limit = 100;
    const fetchPromises = Array.from({ length: pages }, (_, i) => {
      const url = `${PARSE_BASE}/get_stock_summary?start=${i * limit}&limit=${limit}`;
      return fetch(url, { headers: { "X-API-Key": API_KEY } })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
    });

    const results = await Promise.all(fetchPromises);
    let found = null;

    for (const json of results) {
      if (!json) continue;
      const list = json?.data?.data || json?.data || [];
      found = list.find(item => (item.StockCode || item.Code || "").toUpperCase() === target);
      if (found) break;
    }

    if (!found) return res.status(404).json({ error: "Saham tidak ditemukan" });

    const close = Number(found.Close || found.Last || 0);
    return res.status(200).json({
      data: {
        close,
        open: Number(found.Open || close),
        high: Number(found.High || close),
        low: Number(found.Low || close),
        volume: Number(found.Volume || 0),
        changePercent: Number(found.ChangePercent || 0),
        kode: target,
        name: found.StockName || found.Name || "",
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "InternalNo response
