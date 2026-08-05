const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSEBOT_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "PARSEBOT_API_KEY belum dikonfigurasi" });
  }

  try {
    const limit = 100;
    // Mengambil 3 halaman (total 300 saham) secara paralel
    const pageOffsets = [0, 100, 200];
    
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

    const mapped = allStocks
      .map((item) => {
        const kode = (item.StockCode || item.Code || item.code || "").toUpperCase();
        const changePercent = Number(
          item.ChangePercent || item.change_percent || item.Change || item.Pct || item.pct || 0
        );
        const close = Number(item.Close || item.close || item.Last || 0);
        const name = item.StockName || item.Name || item.name || "";

        return { kode, name, changePercent, close };
      })
      .filter((item) => item.kode && !isNaN(item.changePercent));

    // Urutkan berdasarkan top gainers
    const sorted = [...mapped].sort((a, b) => b.changePercent - a.changePercent);

    return res.status(200).json({
      data: sorted,
    });
  } catch (err) {
    console.error("Parse.bot summary error:", err);
    return res.status(500).json({
      error: "Gagal mengambil data summary",
      message: err.message,
    });
  }
}
