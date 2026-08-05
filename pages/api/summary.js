// =========================
// API SUMMARY (Top Gainers/Losers, real-time via GoAPI)
// =========================
// Menggantikan versi sebelumnya yang membaca dari data/summary.csv
// (file yang perlu di-generate lewat script generate-summary.py
// yang tidak ditemukan di project). Endpoint ini kembali memakai
// data real-time dari GoAPI untuk daftar saham likuid papan utama.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GOAPI_KEY;
  const BASE = "https://api.goapi.io/stock/idx";
  const headers = { "X-API-KEY": apiKey, "Accept": "application/json" };

  // Saham blue-chip likuid papan utama, dipakai sebagai basis
  // Top Gainers/Losers dan Top Pick AI di homepage.
  const daftarSaham = [
    "BBRI", "BMRI", "BBCA", "BBNI", "TLKM",
    "ASII", "UNVR", "GOTO", "ANTM", "ADRO",
    "BRIS", "ICBP", "INDF", "KLBF", "PGAS",
    "PTBA", "SMGR", "UNTR", "EXCL", "MDKA"
  ];

  const normalize = (r) => ({
    kode: r.symbol || r.ticker || "",
    close: Number(r.close || r.last_price || 0),
    open: Number(r.open || 0),
    high: Number(r.high || 0),
    low: Number(r.low || 0),
    volume: Number(r.volume || 0),
    changePercent: Number(r.change_pct || r.percent || 0)
  });

  try {
    const r = await fetch(`${BASE}/prices?symbols=${daftarSaham.join(",")}`, { headers });
    const j = await r.json();
    const results = j.data?.results || [];

    const validData = results.map(normalize).filter(item => item.close > 0);

    // Hitung ulang changePercent kalau API tidak menyediakannya langsung
    validData.forEach(item => {
      if (item.changePercent === 0 && item.open > 0) {
        item.changePercent = ((item.close - item.open) / item.open) * 100;
      }
    });

    return res.status(200).json({ data: validData });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
