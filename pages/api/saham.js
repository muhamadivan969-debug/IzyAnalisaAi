// pages/api/saham.js
// Menggantikan GoAPI dengan Parse.bot IDX API

const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSE_API_KEY;

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
      message: "PARSE_API_KEY belum dikonfigurasi",
    });
  }

  try {
    // Khusus IHSG / COMPOSITE
    if (kode.toUpperCase() === "COMPOSITE" || kode.toUpperCase() === "IHSG") {
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

      // Cari COMPOSITE / IHSG
      const indices = indexJson?.data || indexJson || [];
      const ihsg = Array.isArray(indices)
        ? indices.find(
            (i) =>
              i.IndexCode === "COMPOSITE" ||
              i.index_code === "COMPOSITE" ||
              i.Code === "COMPOSITE" ||
              (i.IndexName || "").toLowerCase().includes("composite")
          )
        : null;

      if (!ihsg) {
        return res.status(404).json({ error: "Data IHSG tidak ditemukan" });
      }

      const close = Number(ihsg.LastVal || ihsg.last_val || ihsg.Close || 0);
      const prev = Number(ihsg.PrevVal || ihsg.prev_val || ihsg.Previous || close);
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

    // Ambil data semua saham (summary harian)
    // Kita ambil beberapa halaman supaya bisa ketemu saham yang diminta
    let found = null;
    const limit = 100;
    let start = 0;

    // Coba maksimal 10 halaman (1000 saham)
    for (let i = 0; i < 10; i++) {
      const url = `\( {PARSE_BASE}/get_stock_summary?start= \){start}&limit=${limit}`;
      const response = await fetch(url, {
        headers: { "X-API-Key": API_KEY },
      });

      const json = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: "Gagal mengambil data saham dari Parse.bot",
          detail: json,
        });
      }

      const list = json?.data?.data || json?.data || json || [];

      if (!Array.isArray(list) || list.length === 0) break;

      found = list.find(
        (item) =>
          (item.StockCode || item.stock_code || item.Code || item.code || "")
            .toUpperCase() === kode.toUpperCase()
      );

      if (found) break;
      start += limit;
    }

    if (!found) {
      return res.status(404).json({
        error: `Saham ${kode.toUpperCase()} tidak ditemukan`,
      });
    }

    // Mapping ke format yang diharapkan frontend
    const close = Number(found.Close || found.close || found.Last || found.last || 0);
    const open = Number(found.Open || found.open || close);
    const high = Number(found.High || found.high || close);
    const low = Number(found.Low || found.low || close);
    const volume = Number(found.Volume || found.volume || 0);
    const changePercent = Number(
      found.ChangePercent ||
        found.change_percent ||
        found.Change ||
        found.Pct ||
        found.pct ||
        0
    );

    return res.status(200).json({
      data: {
        close,
        open,
        high,
        low,
        volume,
        changePercent,
        kode: (found.StockCode || found.Code || kode).toUpperCase(),
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
