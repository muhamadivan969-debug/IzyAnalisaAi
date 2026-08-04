// =========================
// DATA SAHAM PER SEKTOR (IDX-IC)
// Sumber: klasifikasi sektor resmi Bursa Efek Indonesia (IDX-IC)
// Hanya memuat saham papan utama yang paling likuid per sektor
// agar relevan untuk trader (bukan seluruh 900+ emiten BEI).
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
    { symbol: "BDMN", name: "Bank Danamon" },
    { symbol: "BNLI", name: "Bank Permata" },
    { symbol: "AGRO", name: "Bank Raya Indonesia" },
    { symbol: "BBYB", name: "Bank Neo Commerce" }
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
    { symbol: "GEMS", name: "Golden Energy Mines" },
    { symbol: "ELSA", name: "Elnusa" },
    { symbol: "RAJA", name: "Rukun Raharja" },
    { symbol: "ENRG", name: "Energi Mega Persada" },
    { symbol: "AADI", name: "Adaro Andalan Indonesia" }
  ],

  "Tambang": [
    { symbol: "ANTM", name: "Aneka Tambang" },
    { symbol: "INCO", name: "Vale Indonesia" },
    { symbol: "MDKA", name: "Merdeka Copper Gold" },
    { symbol: "TINS", name: "Timah" },
    { symbol: "NCKL", name: "Trimegah Bangun Persada" },
    { symbol: "MBMA", name: "Merdeka Battery Materials" },
    { symbol: "AMMN", name: "Amman Mineral Internasional" },
    { symbol: "BUMI", name: "Bumi Resources" },
    { symbol: "PSAB", name: "J Resources Asia Pasifik" },
    { symbol: "DOID", name: "BUMA Internasional Grup" }
  ],

  "Teknologi": [
    { symbol: "GOTO", name: "GoTo Gojek Tokopedia" },
    { symbol: "BUKA", name: "Bukalapak.com" },
    { symbol: "EMTK", name: "Elang Mahkota Teknologi" },
    { symbol: "DCII", name: "DCI Indonesia" },
    { symbol: "MTDL", name: "Metrodata Electronics" },
    { symbol: "MCAS", name: "M Cash Integrasi" },
    { symbol: "WIFI", name: "Solusi Sinergi Digital" },
    { symbol: "KIOS", name: "Kioson Komersial Indonesia" },
    { symbol: "CASH", name: "Cashlez Worldwide Indonesia" }
  ],

  "Healthcare": [
    { symbol: "KLBF", name: "Kalbe Farma" },
    { symbol: "SIDO", name: "Sido Muncul" },
    { symbol: "MIKA", name: "Mitra Keluarga Karyasehat" },
    { symbol: "HEAL", name: "Medikaloka Hermina" },
    { symbol: "SILO", name: "Siloam International Hospitals" },
    { symbol: "TSPC", name: "Tempo Scan Pacific" },
    { symbol: "KAEF", name: "Kimia Farma" },
    { symbol: "DVLA", name: "Darya-Varia Laboratoria" },
    { symbol: "SOHO", name: "Soho Global Health" },
    { symbol: "PRDA", name: "Prodia Widyahusada" }
  ],

  "Property": [
    { symbol: "BSDE", name: "Bumi Serpong Damai" },
    { symbol: "CTRA", name: "Ciputra Development" },
    { symbol: "PWON", name: "Pakuwon Jati" },
    { symbol: "SMRA", name: "Summarecon Agung" },
    { symbol: "APLN", name: "Agung Podomoro Land" },
    { symbol: "DMAS", name: "Puradelta Lestari" },
    { symbol: "MTLA", name: "Metropolitan Land" },
    { symbol: "PPRO", name: "PP Properti" },
    { symbol: "LPKR", name: "Lippo Karawaci" },
    { symbol: "MKPI", name: "Metropolitan Kentjana" }
  ],

  "Consumer": [
    { symbol: "ICBP", name: "Indofood CBP Sukses Makmur" },
    { symbol: "INDF", name: "Indofood Sukses Makmur" },
    { symbol: "UNVR", name: "Unilever Indonesia" },
    { symbol: "MYOR", name: "Mayora Indah" },
    { symbol: "AMRT", name: "Sumber Alfaria Trijaya" },
    { symbol: "CMRY", name: "Cisarua Mountain Dairy" },
    { symbol: "ULTJ", name: "Ultrajaya Milk Industry" },
    { symbol: "HMSP", name: "HM Sampoerna" },
    { symbol: "GGRM", name: "Gudang Garam" },
    { symbol: "MAPI", name: "Mitra Adiperkasa" },
    { symbol: "ACES", name: "Ace Hardware Indonesia" },
    { symbol: "ASII", name: "Astra International" }
  ],

  "Transportasi": [
    { symbol: "BIRD", name: "Blue Bird" },
    { symbol: "SMDR", name: "Samudera Indonesia" },
    { symbol: "ASSA", name: "Adi Sarana Armada" },
    { symbol: "TMAS", name: "Temas" },
    { symbol: "GIAA", name: "Garuda Indonesia" },
    { symbol: "JSMR", name: "Jasa Marga" },
    { symbol: "TLKM", name: "Telkom Indonesia" },
    { symbol: "TOWR", name: "Sarana Menara Nusantara" },
    { symbol: "CMPP", name: "AirAsia Indonesia" }
  ]

};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SECTOR_STOCKS;
}
