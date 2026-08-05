const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSEBOT_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!API_KEY) return res.status(500).json({ error: "PARSEBOT_API_KEY belum dikonfigurasi" });

  try {
    // Ambil data 3 halaman (300 saham teratas) secara paralel
    const fetchPromises = Array.from({ length: 3 }, (_, i) => 
      fetch(`${PARSE_BASE}/get_stock_summary?start=${i * 100}&limit=100`, {
        headers: { "X-API-Key": API_KEY }
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    const rawResults = await Promise.all(fetchPromises);
    let allStocks = [];

    rawResults.forEach(json => {
      const list = json?.data?.data || json?.data || json || [];
      if (Array.isArray(list)) allStocks = allStocks.concat(list);
    });

    const mapped = allStocks
      .map(item => {
        const kode = (item.StockCode || item.Code || "").toUpperCase();
        const changePercent = Number(item.ChangePercent || item.change_percent || 0);
        const close = Number(item.Close || item.close || item.Last || 0);
        const name = item.StockName || item.Name || "";
        return { kode, name, changePercent, close };
      })
      .filter(item => item.kode && !isNaN(item.changePercent));

    const sorted = [...mapped].sort((a, b) => b.changePercent - a.changePercent);

    // Tambahkan header cache CDN gratis di Firebase
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return res.status(200).json({ data: sorted });
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: err.message });
  }
}
