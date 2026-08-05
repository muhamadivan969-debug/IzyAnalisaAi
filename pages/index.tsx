import React, { useState, useEffect } from "react";
import Head from "next/head";
import { 
  Home as HomeIcon, 
  Search, 
  MessageSquare, 
  Star, 
  User as UserIcon, 
  Bell, 
  Crown, 
  Settings, 
  LogOut, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Plus, 
  Trash2, 
  ChevronRight, 
  HelpCircle,
  Users
} from "lucide-react";

interface Stock {
  kode: string;
  name: string;
  close: number;
  changePercent: number;
}

export default function Dashboard() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"home" | "analisa" | "stream" | "watchlist" | "profil">("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sectorStocks, setSectorStocks] = useState<any[]>([]);
  const [isSectorLoading, setIsSectorLoading] = useState(false);
  
  // Data States
  const [ihsgData, setIhsgData] = useState<any>(null);
  const [topPicks, setTopPicks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchQueryFilter] = useState<"all" | "bullish" | "bearish">("all");
  const [watchlist, setWatchlist] = useState<string[]>(["BBCA", "TLKM", "ASII"]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat AI state
  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Ambil data IHSG
      const ihsgRes = await fetch("/api/saham?kode=COMPOSITE");
      const ihsgJson = await ihsgRes.json();
      setIhsgData(ihsgJson?.data || null);

      // Ambil data Top Picks dari summary
      const summaryRes = await fetch("/api/summary");
      const summaryJson = await summaryRes.json();
      setTopPicks(summaryJson?.data?.slice(0, 5) || []);
    } catch (err) {
      console.error("Gagal memuat data awal", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectorClick = async (sectorName: string) => {
    setSelectedSector(sectorName);
    setIsSectorLoading(true);
    try {
      const res = await fetch(`/api/sector?name=${encodeURIComponent(sectorName)}`);
      const json = await res.json();
      setSectorStocks(json?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSectorLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleWatchlist = (code: string) => {
    if (watchlist.includes(code)) {
      setWatchlist(watchlist.filter(item => item !== code));
      triggerToast(`${code} dihapus dari Watchlist`);
    } else {
      setWatchlist([...watchlist, code]);
      triggerToast(`${code} ditambahkan ke Watchlist`);
    }
  };

  const askAI = async () => {
    if (!chatMessage.trim()) return;
    setIsChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatMessage,
          context: {
            waktu: new Date().toLocaleTimeString(),
            ihsg: ihsgData?.close || "N/A",
            ihsgPersen: `${ihsgData?.changePercent || 0}%`,
            stockCode: selectedStock
          }
        })
      });
      const json = await res.json();
      setChatReply(json?.reply || "Gagal mendapatkan respons.");
    } catch (err) {
      setChatReply("Gagal menghubungi asisten AI.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="bg-[#05070d] text-[#e5e9f5] min-height-screen flex flex-col font-sans select-none antialiased">
      <Head>
        <title>IzyAnalisaAI - Stock Intelligence</title>
      </Head>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#00c2ff] text-[#05070d] px-6 py-3 rounded-full font-bold shadow-lg z-[999] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#05070d]/85 backdrop-blur-md border-b border-[#111a2e] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="text-[#00c2ff]" size={24} />
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="text-[#00c2ff]">Izy</span>Analisa<span className="text-[#00c2ff]">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4 relative">
          <button className="text-slate-400 hover:text-white transition">
            <Bell size={22} />
          </button>
          
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
            className="w-9 h-9 rounded-full bg-[#111a2e] border border-[#00c2ff] flex items-center justify-center text-[#00c2ff] font-bold hover:bg-[#111a2e]/80 transition"
          >
            P
          </button>

          {/* DROPDOWN PROFILE (ANIMATED FADE) */}
          {isProfileOpen && (
            <div className="absolute right-0 top-12 w-64 bg-[#0a0e1a] border border-[#111a2e] rounded-xl shadow-2xl p-4 z-50 space-y-3">
              <div>
                <h4 className="font-bold">Trader IzyAnalisaAI</h4>
                <p className="text-xs text-[#00c2ff] font-semibold bg-[#00c2ff]/10 inline-block px-2 py-0.5 rounded-full mt-1">Akun Gratis</p>
              </div>
              <hr className="border-[#111a2e]" />
              <button className="w-full flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-[#111a2e] text-[#ffc93c]">
                <Crown size={18} />
                <span className="font-semibold">Upgrade Premium</span>
              </button>
              <button className="w-full flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-[#111a2e] text-slate-300">
                <Settings size={18} />
                <span>Pengaturan</span>
              </button>
              <button className="w-full flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-[#111a2e] text-slate-300">
                <HelpCircle size={18} />
                <span>Bantuan & FAQ</span>
              </button>
              <hr className="border-[#111a2e]" />
              <button className="w-full flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-[#111a2e]/50 text-[#ff4d5a]">
                <LogOut size={18} />
                <span className="font-semibold">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto pb-24 max-w-lg mx-auto w-full px-4 pt-4">
        
        {/* VIEW: HOME */}
        {activeTab === "home" && !selectedStock && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Halo, Trader!</h2>
              <p className="text-xs text-slate-400">Selamat datang di Smart Indonesian Stock Intelligence.</p>
            </div>

            {/* IHSG CARD */}
            <div className="bg-[#0a0e1a] rounded-xl p-6 border border-[#111a2e] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-400">Indeks IHSG</span>
                <span className="text-xs text-slate-500">1D / Realtime</span>
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-slate-800/40 rounded skeleton"></div>
                  <div className="h-4 w-20 bg-slate-800/40 rounded skeleton"></div>
                </div>
              ) : (
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-extrabold tracking-tight">{ihsgData?.close?.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${ihsgData?.changePercent >= 0 ? "bg-[#00d26a]/10 text-[#00d26a]" : "bg-[#ff4d5a]/10 text-[#ff4d5a]"}`}>
                    {ihsgData?.changePercent >= 0 ? "+" : ""}{ihsgData?.changePercent}%
                  </span>
                </div>
              )}

              {/* Chart Placeholder */}
              <div className="h-32 bg-[#111a2e]/40 rounded-lg flex items-center justify-center border border-[#111a2e]/60">
                <span className="text-xs text-slate-500">TradingView IHSG Chart</span>
              </div>
            </div>

            {/* INDEX GRID CARD */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0e1a] rounded-xl p-6 border border-[#111a2e]">
                <span className="text-xs text-slate-400">Fear & Greed Index</span>
                <h3 className="text-xl font-black text-[#ffc93c] mt-1">68</h3>
                <span className="text-xs text-[#ffc93c]">Greedy</span>
              </div>
              <div className="bg-[#0a0e1a] rounded-xl p-6 border border-[#111a2e]">
                <span className="text-xs text-slate-400">Win Rate AI</span>
                <h3 className="text-xl font-black text-[#00d26a] mt-1">84%</h3>
                <span className="text-xs text-[#00d26a]">Bullish</span>
              </div>
            </div>

            {/* SECTION: TOP PICK AI */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold tracking-tight">🔥 Top Pick AI</h3>
                <button className="text-xs text-[#00c2ff] font-semibold">Lihat Semua</button>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-[#0a0e1a] rounded-xl border border-[#111a2e] skeleton"></div>
                  ))
                ) : (
                  topPicks.map(stock => (
                    <div 
                      key={stock.kode} 
                      onClick={() => setSelectedStock(stock.kode)}
                      className="bg-[#0a0e1a] rounded-xl p-4 border border-[#111a2e] flex justify-between items-center hover:border-[#00c2ff] transition cursor-pointer"
                    >
                      <div>
                        <h4 className="font-extrabold">{stock.kode}</h4>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stock.close?.toLocaleString()}</div>
                        <span className={`text-xs font-bold ${stock.changePercent >= 0 ? "text-[#00d26a]" : "text-[#ff4d5a]"}`}>
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* HEATMAP SEKTOR */}
            <div className="space-y-3">
              <h3 className="text-md font-bold tracking-tight">🌡️ Heatmap Sektor</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(SECTOR_MAPPING).map(sector => (
                  <div 
                    key={sector} 
                    onClick={() => handleSectorClick(sector)}
                    className="bg-[#0a0e1a] p-4 rounded-xl border border-[#111a2e] text-center cursor-pointer hover:border-[#00c2ff] transition"
                  >
                    <span className="font-semibold text-sm">{sector}</span>
                    <div className="text-xs font-bold text-[#00d26a] mt-1">+1.45%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SHEET FOR SECTOR CLICK */}
        {selectedSector && (
          <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setSelectedSector(null)} />
            <div className="bg-[#0a0e1a] rounded-t-2xl border-t border-[#111a2e] max-w-lg mx-auto w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto z-10">
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto" onClick={() => setSelectedSector(null)} />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Saham Sektor {selectedSector}</h3>
                <button onClick={() => setSelectedSector(null)} className="text-xs text-slate-400 hover:text-white">Tutup</button>
              </div>

              {isSectorLoading ? (
                <div className="space-y-2 py-6">
                  <div className="h-10 bg-slate-800/40 rounded skeleton"></div>
                  <div className="h-10 bg-slate-800/40 rounded skeleton"></div>
                  <div className="h-10 bg-slate-800/40 rounded skeleton"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {sectorStocks.map(stock => (
                    <div 
                      key={stock.symbol}
                      onClick={() => {
                        setSelectedStock(stock.symbol);
                        setSelectedSector(null);
                      }}
                      className="bg-[#111a2e]/30 border border-[#111a2e] p-3 rounded-xl flex justify-between items-center cursor-pointer hover:border-[#00c2ff] transition"
                    >
                      <div>
                        <h4 className="font-extrabold text-sm">{stock.symbol}</h4>
                        <p className="text-xs text-slate-400">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{stock.close?.toLocaleString()}</div>
                        <span className={`text-xs font-bold ${stock.changePercent >= 0 ? "text-[#00d26a]" : "text-[#ff4d5a]"}`}>
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full bg-[#00c2ff] text-[#05070d] py-3 rounded-xl font-extrabold hover:opacity-90 transition">
                Analisa Sektor dengan AI
              </button>
            </div>
          </div>
        )}

        {/* VIEW: STOCK DETAIL */}
        {selectedStock && (
          <div className="space-y-6">
            <button 
              onClick={() => {
                setSelectedStock(null);
                setChatReply("");
                setChatMessage("");
              }} 
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-semibold">Kembali ke Beranda</span>
            </button>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black tracking-tight">{selectedStock}</h2>
                <p className="text-xs text-slate-400">Analisa Teknis & Sentimen AI</p>
              </div>
              <button 
                onClick={() => toggleWatchlist(selectedStock)} 
                className="p-2 bg-[#0a0e1a] border border-[#111a2e] rounded-xl text-[#ffc93c]"
              >
                <Star size={20} fill={watchlist.includes(selectedStock) ? "#ffc93c" : "transparent"} />
              </button>
            </div>

            {/* Chart Area */}
            <div className="bg-[#0a0e1a] rounded-xl p-4 border border-[#111a2e] h-56 flex items-center justify-center">
              <span className="text-xs text-slate-500">TradingView {selectedStock} Candlestick</span>
            </div>

            {/* AI SCORE SECTION */}
            <div className="bg-[#0a0e1a] rounded-xl p-6 border border-[#111a2e] space-y-4">
              <h3 className="font-bold text-md text-[#00c2ff] flex items-center space-x-2">
                <span>🤖 Analisa AI Score</span>
              </h3>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-3xl font-black text-[#00d26a]">85</span>
                  <span className="text-slate-500 text-sm"> / 100</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#00d26a]/10 text-[#00d26a] text-xs font-black">STRONG BULLISH</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#111a2e]/40 p-3 rounded-lg">
                  <span className="text-xs text-slate-400">Support</span>
                  <p className="font-bold mt-1">7,150</p>
                </div>
                <div className="bg-[#111a2e]/40 p-3 rounded-lg">
                  <span className="text-xs text-slate-400">Resistance</span>
                  <p className="font-bold mt-1">7,425</p>
                </div>
              </div>
            </div>

            {/* AI CHAT BOX ASISTEN */}
            <div className="bg-[#0a0e1a] rounded-xl p-6 border border-[#111a2e] space-y-4">
              <h4 className="font-bold text-sm">Tanya AI Mengenai {selectedStock}</h4>
              <textarea 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Contoh: Apakah ${selectedStock} layak dibeli sekarang?`}
                className="w-full bg-[#111a2e]/50 border border-[#111a2e] p-3 rounded-lg text-sm text-[#e5e9f5] focus:outline-none focus:border-[#00c2ff] h-20 resize-none"
              />
              <button 
                onClick={askAI}
                disabled={isChatLoading}
                className="w-full bg-[#00c2ff] text-[#05070d] py-3 rounded-xl font-extrabold hover:opacity-90 transition disabled:opacity-50"
              >
                {isChatLoading ? "Sedang Berpikir..." : "TANYA AI"}
              </button>

              {chatReply && (
                <div className="bg-[#111a2e]/40 border border-[#111a2e] p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line text-slate-300">
                  {chatReply}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: ANALISA / SCANNER */}
        {activeTab === "analisa" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Cari Saham</h2>
              <p className="text-xs text-slate-400 font-medium">Lakukan pemindaian teknis pintar dengan AI.</p>
            </div>

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari emiten: BBCA, BBRI, GOTO..."
                  className="w-full bg-[#0a0e1a] border border-[#111a2e] py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#00c2ff]"
                />
              </div>
              <button 
                onClick={() => {
                  if (searchQuery.trim()) {
                    setSelectedStock(searchQuery.toUpperCase());
                  }
                }}
                className="bg-[#00c2ff] text-[#05070d] px-6 rounded-xl font-extrabold hover:opacity-90 transition"
              >
                CARI
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex space-x-2">
              <button onClick={() => setSearchQueryFilter("all")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${searchFilter === "all" ? "bg-[#00c2ff] text-[#05070d] border-[#00c2ff]" : "bg-transparent border-[#111a2e] text-slate-400"}`}>Semua</button>
              <button onClick={() => setSearchQueryFilter("bullish")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${searchFilter === "bullish" ? "bg-[#00d26a]/15 text-[#00d26a] border-[#00d26a]" : "bg-transparent border-[#111a2e] text-slate-400"}`}>Bullish</button>
              <button onClick={() => setSearchQueryFilter("bearish")} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${searchFilter === "bearish" ? "bg-[#ff4d5a]/15 text-[#ff4d5a] border-[#ff4d5a]" : "bg-transparent border-[#111a2e] text-slate-400"}`}>Bearish</button>
            </div>

            {/* SCAN RESULTS */}
            <div className="space-y-3">
              <div className="bg-[#0a0e1a] rounded-xl p-4 border border-[#111a2e] flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold">TLKM</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#00d26a]/15 text-[#00d26a] font-bold">BULLISH</span>
                </div>
                <ChevronRight className="text-slate-500" size={16} />
              </div>
              
              {/* Premium Lock Item */}
              <div className="bg-[#0a0e1a]/50 rounded-xl p-4 border border-[#111a2e] flex justify-between items-center opacity-70">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-slate-400">UNVR</span>
                  <div className="flex items-center space-x-1 text-[#ffc93c]">
                    <Lock size={12} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Premium Only</span>
                  </div>
                </div>
                <Lock className="text-[#ffc93c]" size={16} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: WATCHLIST */}
        {activeTab === "watchlist" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Watchlist Saya</h2>
              <p className="text-xs text-slate-400">Pantau pergerakan harga saham favorit Anda.</p>
            </div>

            {No response
