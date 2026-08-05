// =========================
// API SAHAM (real-time via GoAPI)
// =========================
// Menggantikan versi sebelumnya yang membaca dari file CSV lokal
// (data/Saham/Semua/{kode}.csv). Pendekatan CSV dihentikan karena
// membutuhkan ~950 file yang harus di-generate & di-update manual,
// yang berisiko membuat seluruh fitur analisa mati kalau file belum
// lengkap. Endpoint ini kembali memakai data real-time dari GoAPI,
// yang sudah diverifikasi bekerja pada iterasi sebelumnya.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { kode, companies } = req.query;
  const apiKey = process.env.GOAPI_KEY;
  const BASE = "https://api.goapi.io/stock/idx";
  const headers = { "X-API-KEY": apiKey, "Accept": "application/json" };

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
    // Daftar seluruh emiten (dipakai untuk autocomplete pencarian)
    if (companies === "true") {
      const r = await fetch(`${BASE}/companies`, { headers });
      const j = await r.json();
      const listEmiten = j.data?.results || j.data || [];
      return res.status(200).json({
        data: listEmiten.map(c => ({ symbol: c.symbol, name: c.name }))
      });
    }

    if (!kode) {
      return res.status(400).json({ error: "Parameter 'kode' wajib diisi" });
    }

    // IHSG / Composite index
    if (kode === "COMPOSITE" || kode === "IHSG") {
      const r = await fetch(`${BASE}/composite`, { headers });
      const j = await r.json();
      const item = j.data?.results?.[0] || j.data;
      if (item && (item.close || item.last || item.value)) {
        return res.status(200).json({
          data: {
            kode: "IHSG",
            close: Number(item.close || item.last || item.value || 0),
            open: Number(item.open || 0),
            high: Number(item.high || 0),
            low: Number(item.low || 0),
            volume: Number(item.volume || 0),
            changePercent: Number(item.change_pct || item.percent || 0)
          }
        });
      }
      return res.status(404).json({ error: "Data IHSG tidak tersedia", detail: j });
    }

    // Saham individual
    const r = await fetch(`${BASE}/prices?symbols=${kode}`, { headers });
    const j = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Gagal mengambil data saham", detail: j });
    }

    const item = j.data?.results?.[0];
    if (!item) {
      return res.status(404).json({ error: "Saham tidak ditemukan", detail: j });
    }

    return res.status(200).json({ data: normalize(item) });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
