export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { kode, list } = req.query;
  const apiKey = process.env.GOAPI_KEY;

  try {

    // Mode: ambil banyak saham sekaligus (untuk Scanner/Top Gainers)
    if (list === "true") {

      const daftarSaham = [
        "BBRI", "BMRI", "BBCA", "BBNI", "TLKM",
        "ASII", "UNVR", "GOTO", "ANTM", "ADRO",
        "BRIS", "ICBP", "INDF", "KLBF", "PGAS",
        "PTBA", "SMGR", "UNTR", "EXCL", "MDKA"
      ];

      const promises = daftarSaham.map(async (kodeSaham) => {
        try {
          const response = await fetch(`https://api.goapi.io/stock/idx/${kodeSaham}`, {
            headers: { "X-API-KEY": apiKey }
          });
          const data = await response.json();
          const d = data.data || data;

          return {
            kode: kodeSaham,
            close: Number(d.ClosePrice || d.LastPrice || d.close || 0),
            open: Number(d.OpenPrice || d.open || 0),
            high: Number(d.HighPrice || d.high || 0),
            low: Number(d.LowPrice || d.low || 0),
            volume: Number(d.Volume || d.volume || 0),
            changePercent: Number(d.ChangePercent || d.change_percent || 0)
          };
        } catch (err) {
          return null;
        }
      });

      const hasil = await Promise.all(promises);
      const validData = hasil.filter(item => item !== null && item.close > 0);

      return res.status(200).json({ data: validData });
    }

    // Mode: ambil 1 saham spesifik (seperti sebelumnya)
    if (!kode) {
      return res.status(400).json({ error: "Parameter 'kode' wajib diisi" });
    }

    const response = await fetch(`https://api.goapi.io/stock/idx/${kode}`, {
      headers: { "X-API-KEY": apiKey }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Gagal mengambil data saham", detail: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
