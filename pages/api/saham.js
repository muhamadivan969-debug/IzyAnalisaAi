const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSEBOT_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!API_KEY) return res.status(500).json({ error: "PARSEBOT_API_KEY belum dikonfigurasi" });

  const { kode } = req.query;
  if (!kode) return res.status(400).json({ error: "Parameter 'kode' wajib diisi" });

  try {
    const searchCode = kode.toUpperCase();

    // Khusus IHSG / COMPOSITE
    if (searchCode === "COMPOSITE" || searchCode === "IHSG") {
      const r = await fetch(`${PARSE_BASE}/get_market_index_summary`, {
        headers: { "X-API-Key": API_KEY }
      });
      const json = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: "Gagal mengambil data IHSG", detail: json });

      const list = Array.isArray(json?.data) ? json.data : json?.data?.data || [];
      const ihsg = list.find(i => 
        (i.IndexCode || i.Code || "").toUpperCase() === "COMPOSITE" ||
        (i.IndexName || "").toLowerCase().includes("composite")
      );

      if (!ihsg) return res.status(404).json({ error: "Data IHSG tidak ditemukan" });

      const close = Number(ihsg.LastVal || ihsg.Close || 0);
      const prev = Number(ihsg.PrevVal || close);
      const changePercent = prev ? ((close - prev) / prev) * 100 : Number(ihsg.ChgPct || 0);

      return res.status(200).json({
        data: {
          close,
          open: Number(ihsg.OpenVal || close),
          high: Number(ihsg.HighVal || close),
          low: Number(ihsg.LowVal || close),
          volume: 0,
          changePercent: Number(changePercent.toFixed(2)),
          kode: "COMPOSITE",
          name: "IHSG"
        }
      });
    }

    // Cari Saham Biasa secara Paralel (Menghindari Loop Lambat)
    const fetchPromises = Array.from({ length: 10 }, (_, i) => 
      fetch(`${PARSE_BASE}/get_stock_summary?start=${i * 100}&limit=100`, {
        headers: { "X-API-Key": API_KEY }
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    const rawResults = await Promise.all(fetchPromises);
    let found = null;

    for (const json of rawResults) {
      const list = json?.data?.data || json?.data || json || [];
      if (Array.isArray(list)) {
        found = list.find(item => 
          (item.StockCode || item.Code || "").toUpperCase() === searchCode
        );
        if (found) break;
      }
    }

    if (!found) return res.status(404).json({ error: `Saham ${searchCode} tidak ditemukan` });

    const close = Number(found.Close || found.Last || 0);
    return res.status(200).json({
      data: {
        close,
        open: Number(found.Open || close),
        high: Number(found.High || close),
        low: Number(found.Low || close),
        volume: Number(found.Volume || 0),
        changePercent: Number(found.ChangePercent || 0),
        kode: searchCode,
        name: found.StockName || found.Name || ""
      }
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", message: err.message });
  }
}
