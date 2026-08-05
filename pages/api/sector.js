// =========================
// API SECTOR (data saham per sektor untuk Heatmap)
// =========================
const SECTOR_STOCKS = {
  "Perbankan": [
    { symbol: "BBCA", name: "Bank Central Asia" },
    { symbol: "BBRI", name: "Bank Rakyat Indonesia" },
    { symbol: "BMRI", name: "Bank Mandiri" },
    { symbol: "BBNI", name: "Bank Negara Indonesia" },
    { symbol: "BRIS", name: "Bank Syariah Indonesia" },
    { symbol: "BBTN", name: "Bank Tabungan Negara" },
    { symbol: "ARTO", name: "Bank Jago" },
    { symbol: "BJTM", name: "Bank Jatim" },
    { symbol: "BJBR", name: "Bank BJB" },
    { symbol: "BTPS", name: "Bank BTPN Syariah" },
    { symbol: "BNGA", name: "Bank CIMB Niaga" },
    { symbol: "BDMN", name: "Bank Danamon" }
  ],
  "Energi": [
    { symbol: "ADRO", name: "Adaro Energy Indonesia" },
    { symbol: "PTBA", name: "Bukit Asam" },
    { symbol: "ITMG", name: "Indo Tambangraya Megah" },
    { symbol: "PGAS", name: "Perusahaan Gas Negara" },
    { symbol: "MEDC", name: "Medco Energi Internasional" },
    { symbol: "AKRA", name: "AKR Corporindo" },
    { symbol: "HRUM", name: "Harum Energy" },
    { symbol: "INDY", name: "Indika Energy" },
    { symbol: "BYAN", name: "Bayan Resources" },
    { symbol: "ELSA", name: "Elnusa" }
  ],
  "Tambang": [
    { symbol: "ANTM", name: "Aneka Tambang" },
    { symbol: "INCO", name: "Vale Indonesia" },
    { symbol: "MDKA", name: "Merdeka Copper Gold" },
    { symbol: "TINS", name: "Timah" },
    { symbol: "NCKL", name: "Trimegah Bangun Persada" },
    { symbol: "MBMA", name: "Merdeka Battery Materials" },
    { symbol: "AMMN", name: "Amman Mineral Internasional" },
    { symbol: "BUMI", name: "Bumi Resources" }
  ],
  "Teknologi": [
    { symbol: "GOTO", name: "GoTo Gojek Tokopedia" },
    { symbol: "BUKA", name: "Bukalapak.com" },
    { symbol: "EMTK", name: "Elang Mahkota Teknologi" },
    { symbol: "DCII", name: "DCI Indonesia" },
    { symbol: "MTDL", name: "Metrodata Electronics" },
    { symbol: "WIFI", name: "Solusi Sinergi Digital" }
  ],
  "Healthcare": [
    { symbol: "KLBF", name: "Kalbe Farma" },
    { symbol: "SIDO", name: "Sido Muncul" },
    { symbol: "MIKA", name: "Mitra Keluarga Karyasehat" },
    { symbol: "HEAL", name: "Medikaloka Hermina" },
    { symbol: "SILO", name: "Siloam International Hospitals" },
    { symbol: "TSPC", name: "Tempo Scan Pacific" },
    { symbol: "KAEF", name: "Kimia Farma" }
  ],
  "Property": [
    { symbol: "BSDE", name: "Bumi Serpong Damai" },
    { symbol: "CTRA", name: "Ciputra Development" },
    { symbol: "PWON", name: "Pakuwon Jati" },
    { symbol: "SMRA", name: "Summarecon Agung" },
    { symbol: "APLN", name: "Agung Podomoro Land" },
    { symbol: "DMAS", name: "Puradelta Lestari" }
  ],
  "Consumer": [
    { symbol: "ICBP", name: "Indofood CBP Sukses Makmur" },
    { symbol: "INDF", name: "Indofood Sukses Makmur" },
    { symbol: "UNVR", name: "Unilever Indonesia" },
    { symbol: "MYOR", name: "Mayora Indah" },
    { symbol: "AMRT", name: "Sumber Alfaria Trijaya" },
    { symbol: "HMSP", name: "HM Sampoerna" },
    { symbol: "GGRM", name: "Gudang Garam" },
    { symbol: "ASII", name: "Astra International" }
  ],
  "Transportasi": [
    { symbol: "BIRD", name: "Blue Bird" },
    { symbol: "SMDR", name: "Samudera Indonesia" },
    { symbol: "ASSA", name: "Adi Sarana Armada" },
    { symbol: "JSMR", name: "Jasa Marga" },
    { symbol: "TLKM", name: "Telkom Indonesia" },
    { symbol: "TOWR", name: "Sarana Menara Nusantara" }
  ]
};

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name } = req.query;
  const apiKey = process.env.GOAPI_KEY;
  const BASE = "https://api.goapi.io/stock/idx";
  const headers = { "X-API-KEY": apiKey, "Accept": "application/json" };

  if (!name || !SECTOR_STOCKS[name]) {
    return res.status(400).json({
      error: "Sektor tidak dikenali",
      availableSectors: Object.keys(SECTOR_STOCKS)
    });
  }

  const stockList = SECTOR_STOCKS[name];
  const symbolBatches = chunk(stockList.map(s => s.symbol), 40);

  const normalize = (r) => ({
    kode: r.symbol || r.ticker || "",
    close: Number(r.close || r.last_price || 0),
    changePercent: Number(r.change_pct || r.percent || 0)
  });

  try {
    const priceMap = {};
    const batchResults = await Promise.all(
      symbolBatches.map(async (batch) => {
        try {
          const r = await fetch(`${BASE}/prices?symbols=${batch.join(",")}`, { headers });
          if (!r.ok) return [];
          const j = await r.json();
          return j.data?.results || [];
        } catch (e) {
          return [];
        }
      })
    );

    batchResults.flat().map(normalize).forEach(item => {
      if (item.kode) priceMap[item.kode] = item;
    });

    const merged = stockList.map(s => {
      const p = priceMap[s.symbol];
      return {
        symbol: s.symbol,
        name: s.name,
        close: p ? p.close : 0,
        changePercent: p ? p.changePercent : 0,
        available: !!p && p.close > 0
      };
    });

    return res.status(200).json({ sector: name, data: merged });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
