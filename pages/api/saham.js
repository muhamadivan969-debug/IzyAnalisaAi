const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSEBOT_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { kode } = req.query;

  if (!kode) {
    return res.status(400).json({ error: "Parameter 'kode' wajib diisi" });
  }

  if (!API_KEY) {
    return res.status(500).json({
      error: "Server error",
      message: "PARSEBOT_API_KEY belum dikonfigurasi",
    });
  }

  try {
    const searchKode = kode.toUpperCase();

    // Jalur Khusus IHSG
    if (searchKode === "COMPOSITE" || searchKode === "IHSG") {
      const indexRes = await fetch(`${PARSE_BASE}/get_market_index_summary`, {
        headers: { "X-API-Key": API_KEY },
      });
      const indexJson = await indexRes.json();

      if (!indexRes.ok) {
        return res.status(indexRes.status).json({
          error: "Gagal mengambil data IHSG",
          detail: indexJson,
        });
      }

      const indices = indexJson?.data || indexJson || [];
      const list = Array.isArray(indices) ? indices : indices?.data || [];

      const ihsg = list.find(
        (i) =>
          (i.IndexCode || i.index_code || i.Code || "").toUpperCase() === "COMPOSITE" ||
          (i.IndexName || i.index_name || "").toLowerCase().includes("composite")
      );

      if (!ihsg) {
        return res.status(404).json({ error: "Data IHSG tidak ditemukan" });
      }

      const close = Number(ihsg.LastVal || ihsg.last_val || ihsg.Close || 0);
      const prev = Number(ihsg.PrevVal || ihsg.prev_val || close);
      const changePercent = prev ? ((close - prev) / prev) * 100 : Number(ihsg.ChgPct || ihsg.chg_pct || 0);

      return res.status(200).json({
        data: {
          close,
          open: Number(ihsg.OpenVal || ihsg.open_val || close),
          high: Number(ihsg.HighVal || ihsg.high_val || close),
          low: Number(ihsg.LowVal || ihsg.low_val || close),
          volume: 0,
          changePercent: Number(changePercent.toFixed(2)),
          kode: "COMPOSITE",
          name: "IHSG",
        },
      });
    }

    // Jalur Saham Biasa - Mengambil 10 Halaman (1000 Saham) Secara Paralel
    const limit = 100;
    const pageOffsets = Array.from({ length: 10 }, (_, idx) => idx * limit);

    const fetchPromises = pageOffsets.map(async (start) => {
      const url = `${PARSE_BASE}/get_stock_summary?start=${start}&limit=${limit}`;
      const response = await fetch(url, {
        headers: { "X-API-Key": API_KEY },
      });
      if (!response.ok) return [];
      const json = await response.json();
      return json?.data?.data || json?.data || json || [];
    });

    const results = await Promise.all(fetchPromises);
    const allStocks = results.flat();

    const found = allStocks.find(
      (item) =>
        (item.StockCode || item.stock_code || item.Code || item.code || "").toUpperCase() === searchKode
    );

    if (!found) {
      return res.status(404).json({
        error: `Saham ${searchKode} tidak ditemukan`,
      });
    }

    const close = Number(found.Close || found.close || found.Last || found.last || 0);
    const open = Number(found.Open || found.open || close);
    const high = Number(found.High || found.high || close);
    const low = Number(found.Low || found.low || close);
    const volume = Number(found.Volume || found.volume || 0);
    const changePercent = Number(
      found.ChangePercent || found.change_percent || found.Change || found.Pct || found.pct || 0
    );

    return res.status(200).json({
      data: {
        close,
        open,
        high,
        low,
        volume,
        changePercent,
        kode: (found.StockCode || found.Code || searchKode).toUpperCase(),
        name: found.StockName || found.Name || found.name || "",
      },
    });
  } catch (err) {
    console.error("Parse.bot saham error:", err);
    return res.status(500).json({
      error: "Terjadi kesalahan server",
      message: err.message,
    });
  }
}
