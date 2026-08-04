export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { kode, list, companies } = req.query;
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

    if (companies === "true") {
      const r = await fetch(`${BASE}/companies`, { headers });
      const j = await r.json();
      const listEmiten = j.data?.results || j.data || [];
      return res.status(200).json({
        data: listEmiten.map(c => ({ symbol: c.symbol, name: c.name }))
      });
    }

    if (list === "true") {
      const daftarSaham = [
        "BBRI", "BMRI", "BBCA", "BBNI", "TLKM",
        "ASII", "UNVR", "GOTO", "ANTM", "ADRO",
        "BRIS", "ICBP", "INDF", "KLBF", "PGAS",
        "PTBA", "SMGR", "UNTR", "EXCL", "MDKA"
      ];
      const r = await fetch(`${BASE}/prices?symbols=${daftarSaham.join(",")}`, { headers });
      const j = await r.json();
      const results = j.data?.results || [];
      const validData = results.map(normalize).filter(item => item.close > 0);
      return res.status(200).json({ data: validData });
    }

    if (!kode) {
      return res.status(400).json({ error: "Parameter 'kode' wajib diisi" });
    }

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
