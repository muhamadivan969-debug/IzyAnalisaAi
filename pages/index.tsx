import Head from "next/head";
import { useState, useEffect, useRef } from "react";

// --- SVG Icons (Lucide Clean Replacements) ---
const BellIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const UserIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const StarIcon = ({ active }: { active: boolean }) => <svg className={`w-6 h-6 ${active ? 'text-[#00c2ff] fill-[#00c2ff]' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.15-.368.56-.599.96-.599s.81.231.96.599l2.122 5.195 5.584.811c.394.057.702.348.81.722a.96.96 0 01-.27 1.01l-4.04 3.937.954 5.561a.96.96 0 01-.397.907c-.31.229-.714.244-1.042.046L12 19.167l-4.992 2.624c-.328.198-.732.183-1.042-.046a.96.96 0 01-.397-.907l.954-5.561-4.04-3.937a.96.96 0 01-.27-1.01c.108-.374.416-.665.81-.722l5.584-.811L11.48 3.499z" /></svg>;
const LockIcon = () => <svg className="w-4 h-4 text-yellow-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const ArrowLeftIcon = () => <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const CrownIcon = () => <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;

interface Stock {
  kode: string;
  name: string;
  close: number;
  changePercent: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "analisa" | "stream" | "watchlist" | "profil">("home");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sectorStocks, setSectorStocks] = useState<any[]>([]);
  const [sectorLoading, setSectorStocksLoading] = useState(false);
  
  const [ihsgData, setIhsgData] = useState({ close: 0, changePercent: 0, loading: true });
  const [topPicks, setTopPicks] = useState<Stock[]>([]);
  const [topPicksLoading, setTopPicksLoading] = useState(true);

  const [searchQuery, setSearchCodeQuery] = useState("");
  const [filterChip, setFilterChip] = useState<"ALL" | "BULLISH" | "BEARISH">("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(["BBCA", "BBRI"]);

  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatReply, setAiChatReply] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ambil data IHSG & Top Picks
  useEffect(() => {
    fetch("/api/saham?kode=COMPOSITE")
      .then(res => res.json())
      .then(json => {
        if (json?.data) {
          setIhsgData({ close: json.data.close, changePercent: json.data.changePercent, loading: false });
        }
      })
      .catch(() => setIhsgData(prev => ({ ...prev, loading: false })));

    fetch("/api/summary")
      .then(res => res.json())
      .then(json => {
        if (json?.data) {
          setTopPicks(json.data.slice(0, 5));
        }
        setTopPicksLoading(false);
      })
      .catch(() => setTopPicksLoading(false));
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleWatchlist = (code: string) => {
    if (watchlist.includes(code)) {
      setWatchlist(watchlist.filter(c => c !== code));
      triggerToast(`${code} dihapus dari Watchlist`);
    } else {
      setWatchlist([...watchlist, code]);
      triggerToast(`${code} ditambahkan ke Watchlist`);
    }
  };

  const handleSectorClick = async (sectorName: string) => {
    setSelectedSector(sectorName);
    setSectorStocksLoading(true);
    setSectorStocks([]);
    try {
      const res = await fetch(`/api/sector?name=${encodeURIComponent(sectorName)}`);
      const json = await res.json();
      if (json?.data) {
        setSectorStocks(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSectorStocksLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!aiChatInput.trim()) return;
    setAiChatLoading(true);
    setAiChatReply("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: aiChatInput,
          context: selectedStock ? {
            stockCode: selectedStock.kode,
            stockName: selectedStock.name,
            close: selectedStock.close,
            changePercent: selectedStock.changePercent,
            waktu: new Date().toLocaleTimeString()
          } : undefined
        })
      });
      const json = await res.json();
      setAiChatReply(json.reply || "Gagal mendapatkan jawaban AI.");
    } catch {
      setAiChatReply("Terjadi kesalahan server.");
    } finally {
      setAiChatLoading(false);
    }
  };

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-[#111a2e] rounded-lg ${className}`} />
  );

  return (
    <div className="bg-[#05070d] text-[#e5e9f5] min-h-screen pb-20 relative select-none">
      <Head>
        <title>IzyAnalisaAI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-45 bg-[#05070d]/90 backdrop-blur-md border-b border-[#ffffff12] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-1" onClick={() => { setSelectedStock(null); setSelectedSector(null); setActiveTab("home"); }}>
          <h1 className="text-xl font-extrabold tracking-tight cursor-pointer">
            <span className="text-[#00c2ff]">Izy</span>Analisa<span className="text-[#00c2ff]">AI</span>
          </h1>
        </div>
        <div className="flex items-center space-x-3 relative">
          <button className="p-2 hover:bg-[#0a0e1a] rounded-lg transition-colors">
            <BellIcon />
          </button>
          <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="p-1 border border-[#00c2ff]/30 rounded-full bg-[#0a0e1a] transition-all">
            <div className="w-7 h-7 flex items-center justify-center text-[#00c2ff]">
              <UserIcon />
            </div>
          </button>

          {showProfileDropdown && (
            <div ref={dropdownRef} className="absolute right-0 top-11 w-64 bg-[#0a0e1a] border border-[#ffffff12] rounded-xl shadow-2xl p-4 z-50 animate-fade">
              <div className="pb-3 border-b border-[#ffffff12]">
                <h4 className="font-semibold text-sm">Trader IzyAnalisaAI</h4>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1">Akun Gratis</span>
              </div>
              <div className="py-2 space-y-2 text-sm text-gray-300">
                <button className="w-full text-left flex items-center py-1 hover:text-white"><CrownIcon /> Upgrade Premium</button>
                <button className="w-full text-left py-1 hover:text-white">Pengaturan</button>
                <button className="w-full text-left py-1 hover:text-white">Ganti Akun</button>
                <button className="w-full text-left py-1 hover:text-white">Notifikasi</button>
                <button className="w-full text-left py-1 hover:text-white">Bantuan & FAQ</button>
              </div>
              <div className="pt-2 border-t border-[#ffffff12]">
                <button className="w-full text-left text-[#ff4d5a] text-sm font-semibold py-1">Log Out</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- KONTEN UTAMA --- */}
      <main className="max-w-md mx-auto p-4 space-y-6">

        {activeTab === "home" && !selectedStock && (
          <div className="space-y-6 animate-fade">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Selamat Datang</p>
              <h2 className="text-2xl font-bold">Halo, Trader!</h2>
            </div>

            <div className="bg-[#0a0e1a] p-5 rounded-xl border border-[#ffffff12] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-medium">IHSG</span>
                <span className="text-xs bg-[#111a2e] px-2.5 py-1 rounded-full text-gray-300 font-mono">1D</span>
              </div>
              {ihsgData.loading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-extrabold tracking-tight">{ihsgData.close.toLocaleString()}</span>
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${ihsgData.changePercent >= 0 ? "bg-[#00d26a]/15 text-[#00d26a]" : "bg-[#ff4d5a]/15 text-[#ff4d5a]"}`}>
                    {ihsgData.changePercent >= 0 ? "+" : ""}{ihsgData.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] text-center">
                <p className="text-xs text-gray-400 font-medium">Fear & Greed Index</p>
                <h3 className="text-2xl font-extrabold mt-1 text-[#00c2ff]">68</h3>
                <span className="text-xs text-gray-400">Greedy</span>
              </div>
              <div className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] text-center">
                <p className="text-xs text-gray-400 font-medium">AI Win Rate</p>
                <h3 className="text-2xl font-extrabold mt-1 text-[#00d26a]">84%</h3>
                <span className="text-xs text-gray-400">High Confidence</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight">🔥 Top Pick AI</h3>
              <div className="space-y-3">
                {topPicksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : (
                  topPicks.map(stock => (
                    <div key={stock.kode} onClick={() => setSelectedStock(stock)} className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] flex justify-between items-center cursor-pointer hover:bg-[#111a2e] transition-colors">
                      <div>
                        <h4 className="font-bold text-base text-white">{stock.kode}</h4>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm block">{stock.close.toLocaleString()}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${stock.changePercent >= 0 ? "bg-[#00d26a]/15 text-[#00d26a]" : "bg-[#ff4d5a]/15 text-[#ff4d5a]"}`}>
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight">🌡️ Heatmap Sektor</h3>
              <p className="text-xs text-gray-400 -mt-2">Ketuk sektor untuk menampilkan list 950+ saham BEI secara dinamis.</p>
              <div className="grid grid-cols-2 gap-3">
                {["Perbankan", "Energi", "Tambang", "Teknologi", "Healthcare", "Property", "Consumer", "Transportasi"].map(sector => (
                  <div key={sector} onClick={() => handleSectorClick(sector)} className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] text-center cursor-pointer hover:border-[#00c2ff]/50 transition-colors">
                    <h4 className="font-bold text-sm">{sector}</h4>
                    <span className="text-xs text-[#00d26a] font-semibold bg-[#00d26a]/10 px-2 py-0.5 rounded-full inline-block mt-1">+1.42%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analisa" && !selectedStock && (
          <div className="space-y-6 animate-fade">
            <h2 className="text-xl font-bold">Cari & Scan Saham</h2>
            <div className="relative">
              <input type="text" placeholder="Masukkan kode saham... (e.g. BBCA)" value={searchQuery} onChange={(e) => setSearchCodeQuery(e.target.value.toUpperCase())} className="w-full bg-[#0a0e1a] border border-[#ffffff12] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00c2ff]" />
              <button onClick={() => {
                if (searchQuery) {
                  setSelectedStock({ kode: searchQuery, name: "Saham Pencarian", close: 0, changePercent: 0 });
                }
              }} className="absolute right-2 top-2 bg-[#00c2ff] text-[#05070d] text-xs font-bold px-3 py-1.5 rounded-lg">CARI</button>
            </div>

            <div className="flex space-x-2">
              {(["ALL", "BULLISH", "BEARISH"] as const).map(chip => (
                <button key={chip} onClick={() => setFilterChip(chip)} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${filterChip === chip ? 'bg-[#00c2ff] text-[#05070d] border-[#00c2ff]' : 'border-[#ffffff12] text-gray-400'}`}>{chip}</button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] flex justify-between items-center">
                <div>
                  <h4 className="font-bold flex items-center text-sm"><LockIcon /> AI Auto Technical Scanner</h4>
                  <p className="text-xs text-gray-400 mt-1">Gunakan screening teknikal instan</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stream" && !selectedStock && (
          <div className="space-y-6 animate-fade">
            <h2 className="text-xl font-bold">Diskusi Komunitas</h2>
            <div className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] space-y-3">
              <textarea placeholder="Bagikan ide analisismu hari ini..." className="w-full bg-[#111a2e] border border-[#ffffff12] rounded-lg p-3 text-sm focus:outline-none" rows={3} />
              <div className="flex justify-end">
                <button className="bg-[#00c2ff] text-[#05070d] text-xs font-bold px-4 py-2 rounded-lg">POST</button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#00c2ff]/10 to-[#00e5a8]/10 p-5 rounded-xl border border-[#00c2ff]/25 space-y-3 text-center">
              <h3 className="font-bold text-base text-white">Grup VIP Premium Chat</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Dapatkan sinyal harian eksklusif, analisis chart komprehensif, dan trading plan tanpa batas.</p>
              <button className="bg-[#00c2ff] text-[#05070d] text-xs font-bold px-6 py-2 rounded-lg mt-2">Daftar Sekarang</button>
            </div>
          </div>
        )}

        {activeTab === "watchlist" && !selectedStock && (
          <div className="space-y-6 animate-fade">
            <h2 className="text-xl font-bold">Watchlist Favorit Saya</h2>
            {watchlist.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-10">Belum ada saham yang ditambahkan ke watchlist Anda.</p>
            ) : (
              <div className="space-y-3">
                {watchlist.map(code => (
                  <div key={code} onClick={() => setSelectedStock({ kode: code, name: "Saham Watchlist", close: 0, changePercent: 0 })} className="bg-[#0a0e1a] p-4 rounded-xl border border-[#ffffff12] flex justify-between items-center cursor-pointer hover:bg-[#111a2e] transition-colors">
                    <div>
                      <h4 className="font-bold text-white text-base">{code}</h4>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(code); }} className="text-[#00c2ff]">
                      <StarIcon active={true} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profil" && !selectedStock && (
          <div className="space-y-6 animate-fade">
            <div className="bg-[#0a0e1a] p-5 rounded-xl border border-[#ffffff12] flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-lg text-white">👤</div>
              <div>
                <h3 className="font-bold text-base">Trader IzyAnalisaAI</h3>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1">Akun Gratis</span>
              </div>
            </div>

            <div className="bg-[#0a0e1a] rounded-xl border border-[#ffffff12] overflow-hidden divide-y divide-[#ffffff12]">
              <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm">Upgrade Premium</span><span className="text-gray-500">&rsaquo;</span></div>
              <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm">Pengaturan</span><span className="text-gray-500">&rsaquo;</span></div>
              <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm">Bantuan & FAQ</span><span className="text-gray-500">&rsaquo;</span></div>
            </div>
          </div>
        )}

        {/* --- MODAL DETAIL SAHAM --- */}
        {selectedStock && (
          <div className="space-y-6 animate-fade">
            <button onClick={() => setSelectedStock(null)} className="flex items-center space-x-2 text-gray-400 text-sm hover:text-white mb-2">
              <ArrowLeftIcon /> Back to Dashboard
            </button>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">{selectedStock.kode}</h2>
                <p className="text-sm text-gray-400">{selectedStock.name}</p>
              </div>
              <button onClick={() => toggleWatchlist(selectedStock.kode)}>
                <StarIcon active={watchlist.includes(selectedStock.kode)} />
              </button>
            </div>

            <div className="bg-[#0a0e1a] p-5 rounded-xl border border-[#ffffff12] space-y-4">
              <h3 className="text-base font-bold text-[#00c2ff] flex items-center">⭐ Hasil Analisis AI Pintar</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#111a2e] p-3 rounded-lg">
                  <span className="text-xs text-gray-400">Skor Keyakinan</span>
                  <h4 className="text-2xl font-bold text-[#00d26a] mt-1">82 / 100</h4>
                </div>
                <div className="bg-[#111a2e] p-3 rounded-lg">
                  <span className="text-xs text-gray-400">Rekomendasi</span>
                  <h4 className="text-2xl font-bold text-[#00c2ff] mt-1">BULLISH</h4>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <p className="flex justify-between"><span>Support Terdekat:</span> <span className="font-mono text-white font-bold">9,200</span></p>
                <p className="flex justify-between"><span>Resistance Terdekat:</span> <span className="font-mono text-white font-bold">10,150</span></p>
              </div>
            </div>

            <div className="bg-[#0a0e1a] p-5 rounded-xl border border-[#ffffff12] space-y-3">
              <h3 className="text-sm font-bold text-white">Tanya AI asisten IzyAnalisaAI</h3>
              <p className="text-xs text-gray-400">Tanyakan tentang proyeksi, tren, atau target harga saham {selectedStock.kode}.</p>
              
              <div className="flex space-x-2 mt-2">
                <input type="text" placeholder="Contoh: Bagaimana prospek minggu ini?" value={aiChatInput} onChange={(e) => setAiChatInput(e.target.value)} className="flex-1 bg-[#111a2e] border border-[#ffffff12] rounded-lg px-3 py-2 text-xs focus:outline-none" />
                <button onClick={handleAskAI} disabled={aiChatLoading} className="bg-[#00c2ff] text-[#05070d] text-xs font-bold px-4 py-2 rounded-lg">KIRIM</button>
              </div>

              {aiChatLoading && <Skeleton className="h-10 w-full mt-2" />}
              {aiChatReply && (
                <div className="p-3 bg-[#111a2e] rounded-lg text-xs mt-3 text-gray-300 border border-[#ffffff12] max-h-48 overflow-y-auto whitespace-pre-line">
                  {aiChatReply}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- SECTOR DETAIL BOTTOM SHEET --- */}
      {selectedSector && (
        <>
          <div onClick={() => setSelectedSector(null)} className="fixed inset-0 bg-black/60 z-40 transition-opacity" />
          <div className="fixed inset-x-0 bottom-0 max-w-md mx-auto bg-[#0a0e1a] border-t border-[#ffffff12] rounded-t-[22px] p-6 z-50 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setSelectedSector(null)} />
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Sektor: {selectedSector}</h3>
              <button onClick={() => setSelectedSector(null)} className="text-gray-400 text-lg">&times;</button>
            </div>

            {sectorLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {sectorStocks.map(stock => (
                  <div key={stock.symbol} onClick={() => { setSelectedStock({ kode: stock.symbol, name: stock.name, close: stock.close, changePercent: stock.changePercent }); setSelectedSector(null); }} className="bg-[#111a2e] p-4 rounded-xl border border-[#ffffff12] flex justify-between items-center cursor-pointer hover:bg-gray-800">
                    <div>
                      <h4 className="font-bold text-white">{stock.symbol}</h4>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm block">{stock.close.toLocaleString()}</span>
                      <span className={`text-xs font-semibold ${stock.changePercent >= 0 ? "text-[#00d26a]" : "text-[#ff4d5a]"}`}>
                        {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => triggerToast("Analisis Sektor Premium Sedang Diproses...")} className="w-full bg-[#00c2ff] text-[#05070d] font-bold text-sm py-3 rounded-xl mt-6 transition-colors">
              Analisa Sektor dengan AI
            </button>
          </div>
        </>
      )}

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#00c2ff] text-[#05070d] text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl z-50 animate-fade">
          {toastMessage}
        </div>
      )}

      {/* --- NAVIGASI BAWAH (STICKY BOTTOM NAV) --- */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#05070d]/90 backdrop-blur-md border-t border-[#ffffff12] max-w-md mx-auto z-40 flex justify-around py-3">
        {(["home", "analisa", "stream", "watchlist", "profil"] as const).map(tab => (
          <button key={tab} onClick={() => { setSelectedStock(null); setActiveTab(tab); }} className={`flex flex-col items-center space-y-1 text-[10px] font-bold transition-all ${activeTab === tab ? "text-[#00c2ff]" : "text-gray-500"}`}>
            <div className="w-5 h-5 flex items-center justify-center">
              {tab === "home" && <UserIcon />}
              {tab === "analisa" && <LockIcon />}
              {tab === "stream" && <BellIcon />}
              {tab === "watchlist" && <StarIcon active={activeTab === "watchlist"} />}
              {tab === "profil" && <UserIcon />}
            </div>
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
