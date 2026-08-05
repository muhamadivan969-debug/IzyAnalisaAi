const PARSE_BASE = "https://api.parse.bot/scraper/3344e652-0a91-4a3c-96f6-d64b4d7f7369";
const API_KEY = process.env.PARSEBOT_API_KEY;

// Sektor standar BEI untuk pemetaan dinamis seluruh saham
const SECTOR_MAPPING = {
  "Perbankan": ["BBCA", "BBRI", "BMRI", "BBNI", "BRIS", "BBTN", "ARTO", "BJTM", "BJBR", "BTPS", "BNGA", "BDMN"],
  "Energi": ["ADRO", "PTBA", "ITMG", "PGAS", "MEDC", "AKRA", "HRUM", "INDY", "BYAN", "ELSA"],
  "Tambang": ["ANTM", "INCO", "MDKA", "TINS", "NCKL", "MBMA", "AMMN", "BUMI"],
  "Teknologi": ["GOTO", "BUKA", "EMTK", "DCII", "MTDL", "WIFI"],
  "Healthcare": ["KLBF", "SIDO", "MIKA", "HEAL", "SILO", "TSPC", "KAEF"],
  "Property": ["BSDE", "CTRA", "PWON", "SMRA", "APLN", "DMAS"],
  "Consumer": ["ICBP", "INDF", "UNVR", "MYOR", "AMRT", "HMSP", "GGRM", "ASII"],
  "Transportasi": ["BIRD", "SMDR", "ASSA", "JSMR", "TLKM", "TOWR"]
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!API_KEY) return res.status(500).json({ error: "PARSEBOT_API_KEY belum dikonfigurasi" });

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Parameter 'name' (nama sektor) wajib diisi" });

  try {
    // Ambil data 10 halaman secara paralel (mencakup hingga 1000 saham)
    const fetchPromises = Array.from({ length: 10 }, (_, i) => 
      fetch(`${PARSE_BASE}/get_stock_summary?start=${i * 100}&limit=100`, {
        headers: { "X-API-Key": API_KEY },
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    const rawResults = await Promise.all(fetchPromises);
    let allStocks = [];

    rawResults.forEach(json => {
      const list = json?.data?.data || json?.data || json || [];
      if (Array.isArray(list)) allStocks = allStocks.concat(list);
    });

    // Saring & petakan saham berdasarkan sektor yang diminta
    const targets = SECTOR_MAPPING[name] || [];
    const filtered = allStocks
      .filter(item => {
        const code = (item.StockCode || item.Code || "").toUpperCase();
        return targets.includes(code) || (item.Sector && item.Sector.toLowerCase() === name.toLowerCase());
      })
      .map(item => ({
        symbol: (item.StockCode || item.Code || "").toUpperCase(),
        name: item.StockName || item.Name || "",
        close: Number(item.Close || item.Last || 0),
        changePercent: Number(item.ChangePercent || item.change_percent || 0),
        available: true
      }));

    // Tambahkan header cache CDN Firebase gratis
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    return res.status(200).json({ sector: name, data: filtered });
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: err.message });
  }
}
