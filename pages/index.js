// pages/index.js
import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { 
  Home as HomeIcon, 
  Search, 
  MessageSquare, 
  Star, 
  User, 
  Bell, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Lock, 
  ChevronRight, 
  Sparkles, 
  Crown, 
  LogOut, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  X, 
  Send,
  Loader2,
  Users
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home"); // home, analisa, stream, watchlist, profil
  const [activeStock, setActiveStock] = useState(null); // Ticker aktif untuk detail view
  const [activeSector, setActiveSector] = useState(null); // Sektor aktif untuk bottom sheet
  const [sectorStocks, setSectorStocks] = useState([]);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allStocks, setAllStocks] = useState([]); // 950+ Saham dari /api/summary
  const [ihsgData, setIhsgData] = useState({ close: 0, changePercent: 0 });
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(["BBCA", "BBRI", "TLKM", "ADRO"]);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [votedStocks, setVotedStocks] = useState({}); // { TICKER: 'bullish' | 'bearish' }
  const [analysisFilter, setAnalysisFilter] = useState("all"); // all, bullish, bearish

  const dropdownRef = useRef(null);
  const chartContainerRef = useRef(null);

  // Menutup dropdown profil saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAvatarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Summary data (IHSG + Top Picks)
  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        // Load IHSG
        const resIhsg = await fetch("/api/saham?kode=IHSG");
        const dataIhsg = await resIhsg.json();
        if (dataIhsg?.data) {
          setIhsgData({
            close: dataIhsg.data.close,
            changePercent: dataIhsg.data.changePercent
          });
        }

        // Load 950+ Saham dari API Summary
        const resSummary = await fetch("/api/summary");
        const dataSummary = await resSummary.json();
        if (dataSummary?.data) {
          setAllStocks(dataSummary.data);
          // Set top 5 gainers sebagai Top Pick AI
          setTopPicks(dataSummary.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Gagal memuat data awal:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  // Fetch Sector Stocks
  useEffect(() => {
    if (!activeSector) return;
    async function loadSector() {
      try {
        setSectorLoading(true);
        const res = await fetch(`/api/sector?name=${encodeURIComponent(activeSector)}`);
        const result = await res.json();
        if (result?.data) {
          setSectorStocks(result.data);
        }
      } catch (err) {
        console.error("Gagal memuat sektor:", err);
      } finally {
        setSectorLoading(false);
      }
    }
    loadSector();
  }, [activeSector]);

  // Toast System
  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Toggle Watchlist
  const toggleWatchlist = (ticker) => {
    if (watchlist.includes(ticker)) {
      setWatchlist((prev) => prev.filter((t) => t !== ticker));
      showToast(`${ticker} dihapus dari Watchlist`);
    } else {
      setWatchlist((prev) => [...prev, ticker]);
      showToast(`${ticker} ditambahkan ke Watchlist`);
    }
  };

  // AI Chat Handler
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: {
            waktu: new Date().toLocaleTimeString(),
            ihsg: ihsgData.close.toLocaleString("id-ID"),
            ihsgPersen: `${ihsgData.changePercent > 0 ? "+" : ""}${ihsgData.changePercent}%`
          }
        })
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Maaf, asisten AI sedang mengalami gangguan." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // TradingView Chart Integration
  useEffect(() => {
    if (activeStock && chartContainerRef.current) {
      chartContainerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        if (typeof TradingView !== "undefined") {
          new TradingView.widget({
            width: "100%",
            height: 300,
            symbol: `IDX:${activeStock}`,
            interval: "D",
            timezone: "Asia/Jakarta",
            theme: "dark",
            style: "1",
            locale: "id",
            toolbar_bg: "#0a0e1a",
            enable_publishing: false,
            hide_side_toolbar: true,
            allow_symbol_change: false,
            container_id: "tv-chart-container",
            gridColor: "rgba(255, 255, 255, 0.05)",
            studies: ["RSI@tv-basicstudies"]
          });
        }
      };
      document.head.appendChild(script);
    }
  }, [activeStock]);

  return (
    <div className="bg-[#05070d] text-[#e5e9f5] min-height-100vh flex flex-col font-sans selection:bg-[#00c2ff]/30">
      <Head>
        <title>IzyAnalisaAI - Smart Indonesian Stock Intelligence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* TOAST SYSTEM */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-[#0a0e1a] border border-[#00c2ff]/40 text-[#00c2ff] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto animate-fade-in text-sm font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#05070d]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setActiveStock(null); setActiveTab("home"); }}>
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-[#00c2ff]">Izy</span>Analisa<span className="text-[#00c2ff]">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/5 transition" onClick={() => showToast("Tidak ada notifikasi baru")}>
            <Bell className="w-5 h-5 text-[#8b9bb4]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff4d5a] rounded-full"></span>
          </button>

          {/* AVATAR & DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00c2ff] to-[#00e5a8] flex items-center justify-center font-bold text-[#05070d] text-sm hover:scale-105 transition" onClick={() => setAvatarDropdown(!avatarDropdown)}>
              TR
            </button>

            {avatarDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0a0e1a] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="p-3 border-b border-white/5">
                  <p className="font-bold text-sm text-[#e5e9f5]">Trader IzyAnalisaAI</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-white/10 text-[#8b9bb4] rounded">Akun Gratis</span>
                </div>
                <div className="py-1 flex flex-col">
                  <button className="flex items-center gap-3 px-3 py-2 text-sm text-[#ffc93c] hover:bg-white/5 rounded-lg transition" onClick={() => { setAvatarDropdown(false); setActiveTab("profil"); }}>
                    <Crown className="w-4 h-4" /> <span>Upgrade Premium</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2 text-sm text-[#8b9bb4] hover:bg-white/5 rounded-lg transition" onClick={() => setAvatarDropdown(false)}>
                    <Settings className="w-4 h-4" /> <span>Pengaturan</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2 text-sm text-[#8b9bb4] hover:bg-white/5 rounded-lg transition" onClick={() => setAvatarDropdown(false)}>
                    <Users className="w-4 h-4" /> <span>Ganti Akun</span>
                  </button>
                  <button className="flex items-center gap-3 px-3 py-2 text-sm text-[#8b9bb4] hover:bg-white/5 rounded-lg transition" onClick={() => setAvatarDropdown(false)}>
                    <HelpCircle className="w-4 h-4" /> <span>Bantuan & FAQ</span>
                  </button>
                  <div className="h-[1px] bg-white/5 my-1"></div>
                  <button className="flex items-center gap-3 px-3 py-2 text-sm text-[#ff4d5a] hover:bg-[#ff4d5a]/10 rounded-lg transition" onClick={() => { setAvatarDropdown(false); showToast("Anda berhasil Log Out"); }}>
                    <LogOut className="w-4 h-4" /> <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 pb-24">
        {activeStock ? (
          /* =======================================
             HALAMAN DETAIL SAHAM 
             ======================================= */
          <div className="animate-fade-in flex flex-col gap-5">
            <button className="flex items-center gap-2 text-[#8b9bb4] text-sm hover:text-white transition w-fit" onClick={() => setActiveStock(null)}>
              <ChevronLeft className="w-4 h-4" /> Kembali ke Dasbor
            </button>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">{activeStock}</h1>
                  <button onClick={() => toggleWatchlist(activeStock)}>
                    <Star className={`w-5 h-5 ${watchlist.includes(activeStock) ? "text-[#ffc93c] fill-[#ffc93c]" : "text-[#8b9bb4]"}`} />
                  </button>
                </div>
                <p className="text-[#8b9bb4] text-xs">IDX Indonesian Stock Market</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black tracking-tight tnum">Rp 12.450</h2>
                <span className="text-[#00d26a] text-xs font-bold flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +2.48% (+300)
                </span>
              </div>
            </div>

            {/* TRADINGVIEW WIDGET CONTAINER */}
            <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 overflow-hidden relative">
              <div id="tv-chart-container" className="w-full h-[300px]" />
            </div>

            {/* DETAIL STOCK TABS */}
            <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex border-b border-white/5 pb-1 gap-4">
                <span className="text-[#00c2ff] font-bold text-sm border-b-2 border-[#00c2ff] pb-2 cursor-pointer">Analisa AI</span>
                <span className="text-[#8b9bb4] text-sm pb-2 cursor-pointer hover:text-white transition" onClick={() => showToast("Ringkasan data di bawah pembaruan")}>Ringkasan</span>
                <span className="text-[#8b9bb4] text-sm pb-2 cursor-pointer hover:text-white transition" onClick={() => showToast("Belum ada berita terbaru")}>Berita</span>
              </div>

              {/* ANALISA AI TAB CONTENT */}
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111a2e] p-4 rounded-xl border border-white/5 flex flex-col gap-1 text-center">
                    <span className="text-[#8b9bb4] text-xs">AI Confidence Score</span>
                    <h3 className="text-3xl font-black text-[#00c2ff]">88<span className="text-xs text-[#8b9bb4]">/100</span></h3>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#00d26a]/20 text-[#00d26a] rounded-md mx-auto">STRONGLY BULLISH</span>
                  </div>

                  <div className="bg-[#111a2e] p-4 rounded-xl border border-white/5 flex flex-col justify-center gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8b9bb4]">Support:</span>
                      <span className="font-bold text-[#00d26a]">Rp 12.150</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8b9bb4]">Resistance:</span>
                      <span className="font-bold text-[#ff4d5a]">Rp 12.800</span>
                    </div>
                  </div>
                </div>

                {/* RSI INDICATOR BAR */}
                <div className="bg-[#111a2e] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b9bb4]">RSI (14) Indikator</span>
                    <span className="font-bold text-[#ffc93c]">58.4 (Neutral)</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative mt-1">
                    <div className="absolute top-0 bottom-0 left-[58%] w-2 bg-[#ffc93c] rounded-full"></div>
                  </div>
                </div>

                {/* TANYA AI */}
                <div className="bg-[#111a2e] p-4 rounded-xl border border-[#00c2ff]/20 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#00c2ff]">
                    <Sparkles className="w-4 h-4" />
                    <span>Konsultasi AI untuk {activeStock}</span>
                  </div>
                  <p className="text-xs text-[#8b9bb4] leading-relaxed">
                    Ajukan pertanyaan seputar trend teknikal, area beli optimal, maupun sentimen bursa terkini mengenai kode {activeStock}.
                  </p>
                  
                  {/* CHAT BOX */}
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto bg-[#0a0e1a] rounded-lg p-2 text-xs border border-white/5">
                    {chatMessages.length === 0 ? (
                      <p className="text-[#8b9bb4]/40 text-center py-2">Belum ada obrolan. Mulai obrolan di bawah.</p>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className={`p-2 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-[#00c2ff]/10 text-right ml-auto' : 'bg-white/5 text-left mr-auto'}`}>
                          {msg.text}
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-[#8b9bb4]/60 p-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisa...
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input type="text" placeholder={`Tanya AI tentang saham ${activeStock}...`} className="flex-1 bg-[#0a0e1a] border border-white/5 rounded-lg px-3 py-2 text-xs focus:border-[#00c2ff]/50 outline-none" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
                    <button className="p-2 rounded-lg bg-[#00c2ff] text-[#05070d] hover:opacity-90 transition" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SENTIMEN VOTE */}
                <div className="bg-[#111a2e] p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                  <span className="text-[#8b9bb4] text-xs text-center block">Bagaimana Sentimen Komunitas terhadap {activeStock} hari ini?</span>
                  <div className="flex gap-2">
                    <button className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${votedStocks[activeStock] === 'bullish' ? 'bg-[#00d26a] text-white' : 'bg-[#00d26a]/10 text-[#00d26a]'}`} onClick={() => { setVotedStocks({ ...votedStocks, [activeStock]: 'bullish' }); showToast("Sentimen Bullish berhasil dikirim"); }}>
                      <TrendingUp className="w-4 h-4" /> Bullish
                    </button>
                    <button className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${votedStocks[activeStock] === 'bearish' ? 'bg-[#ff4d5a] text-white' : 'bg-[#ff4d5a]/10 text-[#ff4d5a]'}`} onClick={() => { setVotedStocks({ ...votedStocks, [activeStock]: 'bearish' }); showToast("Sentimen Bearish berhasil dikirim"); }}>
                      <TrendingUp className="w-4 h-4 rotate-180" /> Bearish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =======================================
             HALAMAN-HALAMAN UTAMA (TABS)
             ======================================= */
          <>
            {/* 1. HOME TAB */}
            {activeTab === "home" && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#00c2ff]">Halo, Trader!</h1>
                  <p className="text-xs text-[#8b9bb4] mt-0.5">Mari temukan insting pasar cerdas hari ini.</p>
                </div>

                {/* IHSG HIGHLIGHT CARD */}
                <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#8b9bb4] text-xs uppercase font-extrabold tracking-wider">INDONESIA COMPOSITE INDEX (IHSG)</span>
                      <h2 className="text-3xl font-black tracking-tight tnum mt-0.5">
                        {loading ? <span className="skeleton w-32 h-8 block"></span> : (ihsgData.close > 0 ? ihsgData.close.toLocaleString("id-ID") : "6.850,20")}
                      </h2>
                    </div>
                    {loading ? (
                      <span className="skeleton w-16 h-6 rounded"></span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-0.5 ${ihsgData.changePercent >= 0 ? "bg-[#00d26a]/10 text-[#00d26a]" : "bg-[#ff4d5a]/10 text-[#ff4d5a]"}`}>
                        {ihsgData.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {ihsgData.changePercent > 0 ? "+" : ""}{ihsgData.changePercent}%
                      </span>
                    )}
                  </div>
                  {/* CHART IHSG EMBED */}
                  <div className="h-[120px] bg-[#111a2e] rounded-xl flex items-center justify-center border border-white/5">
                    <span className="text-xs text-[#8b9bb4]/50">Interactive IHSG Chart Widget</span>
                  </div>
                </div>

                {/* FEAR/GREED & WINRATE IN ONE ROW */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 flex flex-col gap-1 text-center">
                    <span className="text-[#8b9bb4] text-xs font-semibold">Fear & Greed Index</span>
                    <h3 className="text-2xl font-black text-[#00d26a]">68</h3>
                    <span className="text-[10px] text-[#8b9bb4]">Greedy / Serakah</span>
                  </div>
                  <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 flex flex-col gap-1 text-center">
                    <span className="text-[#8b9bb4] text-xs font-semibold">Win Rate AI</span>
                    <h3 className="text-2xl font-black text-[#00c2ff]">84%</h3>
                    <span className="text-[10px] text-[#00d26a] font-bold">Bullish Condition</span>
                  </div>
                </div>

                {/* TOP PICK AI SECTION */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-md font-black text-[#8b9bb4] tracking-tight uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#ffc93c]" /> Top Pick AI Terpopuler
                  </h3>

                  <div className="stock-grid grid grid-cols-1 md:grid-cols-2 gap-3">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 skeleton h-20"></div>
                      ))
                    ) : (
                      topPicks.map((stock) => (
                        <div key={stock.kode} className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-[#00c2ff]/30 transition cursor-pointer" onClick={() => setActiveStock(stock.kode)}>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-md">{stock.kode}</span>
                            <span className="text-[10px] text-[#8b9bb4] max-w-[140px] truncate">{stock.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs font-black block tnum">Rp {stock.close.toLocaleString("id-ID")}</span>
                              <span className={`text-[10px] font-bold flex items-center justify-end ${stock.changePercent >= 0 ? "text-[#00d26a]" : "text-[#ff4d5a]"}`}>
                                {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent}%
                              </span>
                            </div>
                            <span className="inline-block px-1.5 py-0.5 text-[8px] font-black bg-[#00c2ff]/10 text-[#00c2ff] rounded border border-[#00c2ff]/20">AI BUY</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* HEATMAP SEKTOR */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-md font-black text-[#8b9bb4] tracking-tight uppercase">🌡️ Sektor Heatmap (Click for 950+ Stocks)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Perbankan", state: "green", change: "+1.85%" },
                      { name: "Energi", state: "green", change: "+2.40%" },
                      { name: "Tambang", state: "green", change: "+0.95%" },
                      { name: "Teknologi", state: "red", change: "-1.50%" },
                      { name: "Healthcare", state: "green", change: "+0.45%" },
                      { name: "Property", state: "red", change: "-0.80%" },
                      { name: "Consumer", state: "green", change: "+1.20%" },
                      { name: "Transportasi", state: "green", change: "+0.60%" }
                    ].map((sec) => (
                      <div key={sec.name} className={`border border-white/5 rounded-xl p-4 text-center cursor-pointer transition active:scale-95 ${sec.state === 'green' ? 'bg-[#00d26a]/5 hover:bg-[#00d26a]/15 text-[#00d26a]' : 'bg-[#ff4d5a]/5 hover:bg-[#ff4d5a]/15 text-[#ff4d5a]'}`} onClick={() => setActiveSector(sec.name)}>
                        <h4 className="font-extrabold text-sm text-[#e5e9f5]">{sec.name}</h4>
                        <span className="text-xs font-black block mt-1">{sec.change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ANALISA TAB */}
            {activeTab === "analisa" && (
              <div className="animate-fade-in flex flex-col gap-4">
                <h1 className="text-2xl font-black tracking-tight">AI Scanner Pintar</h1>
                
                {/* SEARCH INPUT */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8b9bb4]" />
                  <input type="text" placeholder="Cari 950+ saham Indonesia... (Contoh: BBCA, TLKM)" className="w-full bg-[#0a0e1a] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:border-[#00c2ff] outline-none transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                {/* FILTER CHIPS */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "Semua Saham" },
                    { id: "bullish", label: "🟢 Bullish Only" },
                    { id: "bearish", label: "🔴 Bearish Only" }
                  ].map((chip) => (
                    <button key={chip.id} className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${analysisFilter === chip.id ? "bg-[#00c2ff] text-[#05070d]" : "bg-[#0a0e1a] border border-white/5 text-[#8b9bb4] hover:text-white"}`} onClick={() => setAnalysisFilter(chip.id)}>
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* STOCK SCANNING RESULTS LIST */}
                <div className="flex flex-col gap-2">
                  {allStocks
                    .filter((s) => {
                      if (searchQuery) {
                        return s.kode.includes(searchQuery.toUpperCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .filter((s) => {
                      if (analysisFilter === "bullish") return s.changePercent > 0;
                      if (analysisFilter === "bearish") return s.changePercent < 0;
                      return true;
                    })
                    .slice(0, 15)
                    .map((s, idx) => (
                      <div key={s.kode} className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-[#00c2ff]/40 cursor-pointer" onClick={() => setActiveStock(s.kode)}>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm">{s.kode}</span>
                          <span className="text-[10px] text-[#8b9bb4] truncate max-w-[150px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-black block">Rp {s.close.toLocaleString("id-ID")}</span>
                            <span className={`text-[10px] font-bold ${s.changePercent >= 0 ? "text-[#00d26a]" : "text-[#ff4d5a]"}`}>
                              No response
