// ======================
// DATA GLOBAL
// ======================
let ihsgData = { value: null, changePercent: null };
let companies = [];

// ======================
// HELPER: UPDATE CHART
// ======================
function updateChart(symbol) {
  const container = document.getElementById("tvchart");
  if (!container) return;
  if (window.tvWidget) {
    try { window.tvWidget.remove(); } catch (e) {}
    container.innerHTML = "";
  }
  window.tvWidget = new TradingView.widget({
    autosize: true,
    symbol: symbol,
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    container_id: "tvchart",
    symbol_search_request_delay: 300,
    widgetbar: { details: false, news: false },
    disabled_features: ["header_symbol_search"],
    enabled_features: [],
    exchanges: ["IDX"],
    symbol_types: ["stock", "index"]
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading");
  if (loading) {
    setTimeout(() => { loading.style.display = "none"; }, 800);
  }

  const btn = document.getElementById("analyzeButton");
  if (btn) btn.addEventListener("click", analyzeStock);

  setupNavigation();
  setupMobileMenu();
  
  updateChart("IDX:COMPOSITE");
  loadIHSG(); 
  loadMarketMovers(); 
  setupChatWidget();
  setupHeatmap();
  setupPremiumModal();
  setupProfilMenu();
  loadCompanies().then(setupAutocomplete);
});

// ======================
// ANALISA SAHAM UTAMA (Menggunakan API CSV lokal)
// ======================
async function analyzeStock(kodeOverride) {
  const inputEl = document.getElementById("stockInput");
  const kode = (kodeOverride || inputEl.value).toUpperCase().trim();

  if (kode === "") { alert("Masukkan kode saham."); return; }
  if (!/^[A-Z]{3,5}$/.test(kode)) { alert("Kode saham tidak valid. Contoh: BBRI, BMRI, TLKM"); return; }

  const btn = document.getElementById("analyzeButton");
  const originalText = btn.textContent;
  btn.textContent = "Menganalisa...";
  btn.disabled = true;

  try {
    // === PANGGIL API CSV KITA ===
    const res = await fetch(`/api/saham?kode=${kode}`);
    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Data saham tidak ditemukan.");
      return;
    }

    const d = json.data;
    if (!d || !d.close || d.close == 0) {
      alert("Data harga tidak tersedia untuk saham ini.");
      return;
    }

    const close = d.close;
    const open = d.open;
    const high = d.high;
    const low = d.low;
    const volume = d.volume;

    // Logika AI Score
    let bullish = 50;
    let alasan = [];
    if (close > open) { bullish += 15; alasan.push("Harga close lebih tinggi dari open (momentum positif)"); }
    else { alasan.push("Harga close lebih rendah dari open (momentum lemah)"); }
    if (close >= high * 0.98) { bullish += 10; alasan.push("Harga mendekati level tertinggi hari ini"); }
    if (close <= low * 1.02) { bullish -= 10; alasan.push("Harga mendekati level terendah hari ini"); }

    if (bullish > 95) bullish = 95;
    if (bullish < 5) bullish = 5;
    const bearish = 100 - bullish;
    const signal = bullish >= 75 ? "STRONG BUY" : bullish >= 60 ? "BUY" : bullish <= 35 ? "SELL" : "HOLD";

    const lvl = hitungLevelTrading(open, high, low, close);
    updateChart(`IDX:${kode}`);

    document.getElementById("analysisCard").innerHTML = `
      <h2>${kode} <span class="badge ${signal == 'STRONG BUY' || signal == 'BUY' ? 'buy' : signal == 'SELL' ? 'sell' : 'hold'}">${signal}</span></h2>
      <div class="analysis-grid">
        <div><p>Harga</p><h3>Rp ${close.toLocaleString("id-ID")}</h3></div>
        <div><p>Bullish</p><h3 class="green">${bullish}%</h3></div>
        <div><p>Bearish</p><h3 class="red">${bearish}%</h3></div>
        <div><p>Confidence</p><h3>${bullish}%</h3></div>
      </div>
      <hr>
      <div class="signal-grid">
        <div><p>Support</p><h3>Rp ${lvl.support.toLocaleString("id-ID")}</h3></div>
        <div><p>Resistance</p><h3>Rp ${lvl.resistance.toLocaleString("id-ID")}</h3></div>
        <div><p>BUY AREA</p><h3>Rp ${lvl.buy1.toLocaleString("id-ID")} - Rp ${lvl.buy2.toLocaleString("id-ID")}</h3></div>
        <div><p class="red">STOP LOSS</p><h3>Rp ${lvl.stopLoss.toLocaleString("id-ID")}</h3></div>
        <div><p>TP1</p><h3 class="green">Rp ${lvl.tp1.toLocaleString("id-ID")}</h3></div>
        <div><p>TP2</p><h3 class="green">Rp ${lvl.tp2.toLocaleString("id-ID")}</h3></div>
        <div><p>TP3</p><h3 class="green">Rp ${lvl.tp3.toLocaleString("id-ID")}</h3></div>
      </div>
      <div style="margin-top:18px;padding:15px;background:#10192d;border-radius:12px;">
        <p style="color:var(--text2);font-size:13px;margin-bottom:8px;font-weight:600;">Alasan AI:</p>
        <ul style="color:var(--text2);font-size:13px;padding-left:18px;line-height:1.8;">
          ${alasan.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>
      <p style="margin-top:15px;color:var(--text2);font-size:12px;">Volume: ${volume.toLocaleString("id-ID")}</p>
      <button id="backToIHSG" style="margin-top:12px;width:100%;background:#1b2644;border:1px solid rgba(255,255,255,.1);padding:10px;border-radius:10px;color:var(--text2);cursor:pointer;font-size:13px;">Kembali ke Chart IHSG</button>
      <p style="margin-top:15px;padding:12px;background:rgba(255,201,60,.1);border-radius:10px;color:var(--yellow);font-size:12px;text-align:center;">DYOR (Do Your Own Research) - Ini bukan saran finansial. Confidence Score menunjukkan keyakinan model, bukan jaminan profit.</p>
    `;

    // Event listener tombol kembali
    document.getElementById("backToIHSG").addEventListener("click", () => {
      updateChart("IDX:COMPOSITE");
      document.getElementById("analysisCard").innerHTML = `<p style="text-align:center;padding:20px 0;opacity:.6;">Cari kode saham di atas untuk melihat hasil analisa AI di sini.</p>`;
    });

  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan. Coba lagi.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ======================
// FUNGSI LEVEL TRADING
// ======================
function hitungLevelTrading(open, high, low, close) {
  const support = low;
  const resistance = high;
  const range = Math.max(resistance - support, close * 0.01);
  let buyLow = support + range * 0.1;
  let buyHigh = support + range * 0.35;
  if (buyHigh > close) buyHigh = close;
  if (buyLow > buyHigh) buyLow = buyHigh * 0.995;
  const stopLoss = Math.round(support * 0.985);
  const tp1 = Math.round(close + range * 0.5);
  const tp2 = Math.round(resistance);
  const tp3 = Math.round(resistance + range * 0.3);
  return {
    buy1: Math.round(buyLow),
    buy2: Math.round(buyHigh),
    stopLoss,
    tp1, tp2, tp3,
    support: Math.round(support),
    resistance: Math.round(resistance)
  };
}

// ======================
// LOAD IHSG (Tetap pakai GoAPI / API eksternal lain)
// ======================
async function loadIHSG() {
  try {
    const res = await fetch('/api/analyze?kode=COMPOSITE'); 
    const json = await res.json();
    const d = json.data || json;
    const value = Number(d.close || d.ClosePrice || d.LastPrice || d.value || 0);
    const changePercent = Number(d.changePercent || d.change_percent || d.percent || 0);
    ihsgData = { value, changePercent };
    const ihsgEl = document.getElementById("ihsg");
    const persenEl = document.getElementById("ihsgPersen");
    if (ihsgEl) ihsgEl.textContent = value > 0 ? value.toLocaleString("id-ID", { maximumFractionDigits: 2 }) : "N/A";
    if (persenEl) {
      const sign = changePercent >= 0 ? "+" : "";
      persenEl.textContent = `${sign}${changePercent.toFixed(2)}%`;
      persenEl.style.color = changePercent >= 0 ? "var(--green)" : "var(--red)";
    }
  } catch (err) { console.error("Gagal load IHSG:", err); }
}

// ======================
// LOAD MARKET MOVERS (Top Gainers & Top Losers)
// ======================
async function loadMarketMovers() {
  try {
    const res = await fetch('/api/summary');
    const json = await res.json();
    const data = json.data || [];
    
    if (data.length === 0) return;

    // Sortir berdasarkan perubahan persen terbesar
    const gainers = [...data].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const losers = [...data].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    renderGainersLosers(gainers, losers);
    renderTopPick(data);
  } catch (err) {
    console.error("Gagal load market movers:", err);
  }
}

// Fungsi render HTML untuk Gainers & Losers
function renderGainersLosers(gainers, losers) {
  const marketGrid = document.querySelector(".market-grid");
  if (!marketGrid) return;
  
  marketGrid.innerHTML = `
    <div class="market-card">
      <h2>📈 Top Gainers</h2>
      <ul>
        ${gainers.map(item => `
          <li style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);">
            <span>${item.kode}</span>
            <span class="green">+${item.changePercent.toFixed(2)}%</span>
          </li>
        `).join("")}
      </ul>
    </div>
    <div class="market-card">
      <h2>📉 Top Losers</h2>
      <ul>
        ${losers.map(item => `
          <li style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);">
            <span>${item.kode}</span>
            <span class="red">${item.changePercent.toFixed(2)}%</span>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

// Fungsi render HTML untuk Top Pick
function renderTopPick(data) {
  // Beri skor AI sederhana
  const withScore = data.map(item => {
    let bullish = 50;
    if (item.close > item.open) bullish += 15;
    if (item.close >= item.high * 0.98) bullish += 10;
    if (item.close <= item.low * 1.02) bullish -= 10;
    if (bullish > 95) bullish = 95;
    if (bullish < 5) bullish = 5;
    let signal = "HOLD";
    if (bullish >= 75) signal = "STRONG BUY";
    else if (bullish >= 60) signal = "BUY";
    else if (bullish <= 35) signal = "SELL";
    return { ...item, bullish, signal };
  });

  // Ambil 3 saham dengan skor tertinggi
  const topPicks = [...withScore].sort((a, b) => b.bullish - a.bullish).slice(0, 3);
  
  const stockGrid = document.querySelector(".stock-grid");
  if (!stockGrid) return;

  stockGrid.innerHTML = topPicks.map(item => `
    <div class="stock-card" data-kode="${item.kode}">
      <div>
        <h3>${item.kode}</h3>
        <p>Saham BEI</p>
      </div>
      <div class="badge ${item.signal === 'STRONG BUY' || item.signal === 'BUY' ? 'buy' : item.signal === 'SELL' ? 'sell' : 'hold'}">
        ${item.signal}
      </div>
      <div class="price">Rp${item.close.toLocaleString("id-ID")}</div>
      <div class="score">AI Confidence <b>${item.bullish}%</b></div>
    </div>
  `).join("");

  // Event listener klik top pick
  stockGrid.querySelectorAll(".stock-card").forEach(card => {
    card.addEventListener("click", () => {
      const kode = card.getAttribute("data-kode");
      document.getElementById("stockInput").value = kode;
      document.getElementById("searchSection").scrollIntoView({ behavior: "smooth" });
      analyzeStock(kode);
    });
  });
}

// ======================
// LOAD COMPANIES (Daftar Emiten)
// ======================
async function loadCompanies() {
  // Dummy data untuk autocomplete sementara
  companies = [
    { symbol: "BBRI", name: "Bank Rakyat Indonesia" },
    { symbol: "BMRI", name: "Bank Mandiri" },
    { symbol: "BBCA", name: "Bank Central Asia" },
    { symbol: "BBNI", name: "Bank Negara Indonesia" },
    { symbol: "TLKM", name: "Telkom Indonesia" },
    { symbol: "ASII", name: "Astra International" },
    { symbol: "UNVR", name: "Unilever Indonesia" },
    { symbol: "GOTO", name: "GoTo Gojek Tokopedia" }
  ];
}

// ======================
// AUTOCOMPLETE
// ======================
function setupAutocomplete() {
  const input = document.getElementById("stockInput");
  if (!input) return;
  const box = document.createElement("div");
  box.id = "autocompleteBox";
  box.style.cssText = "position:absolute;z-index:99;background:#10192d;border:1px solid rgba(255,255,255,.1);border-radius:10px;width:100%;max-height:220px;overflow-y:auto;display:none;top:100%;left:0;";
  input.parentElement.style.position = "relative";
  input.parentElement.appendChild(box);

  input.addEventListener("input", () => {
    const q = input.value.toUpperCase().trim();
    if (q.length < 2) { box.style.display = "none"; return; }
    const results = companies.filter(c => 
      (c.symbol && c.symbol.includes(q)) || 
      (c.name && c.name.toUpperCase().includes(q))
    ).slice(0, 8);
    
    if (results.length === 0) { box.style.display = "none"; return; }
    
    box.innerHTML = results.map(c => 
      `<div class="ac-item" data-symbol="${c.symbol}" style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,.05);color:#e5e9f5;">
        <b>${c.symbol}</b> <span style="color:#8b9bb4;">- ${c.name}</span>
       </div>`
    ).join("");
    
    box.style.display = "block";
    
    box.querySelectorAll(".ac-item").forEach(el => {
      el.addEventListener("click", () => {
        input.value = el.dataset.symbol;
        box.style.display = "none";
        analyzeStock();
      });
    });
  });

  document.addEventListener("click", (e) => {
    if (!box.contains(e.target) && e.target !== input) box.style.display = "none";
  });
}

// ======================
// NAVIGASI & UI LAINNYA
// ======================
function setupNavigation() {
  document.querySelectorAll(".menu button[data-target], .bottom-nav a[data-target]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = el.getAttribute("data-target");
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth" });
      const menu = document.querySelector(".menu");
      if (menu) menu.classList.remove("open");
    });
  });
}

function setupMobileMenu() {
  const header = document.querySelector("header");
  const menu = document.querySelector(".menu");
  if (!header || !menu) return;
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "menu-toggle";
  toggleBtn.innerHTML = "☰";
  toggleBtn.setAttribute("aria-label", "Buka menu");
  header.insertBefore(toggleBtn, menu);
  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("open");
    toggleBtn.innerHTML = menu.classList.contains("open") ? "✕" : "☰";
  });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== toggleBtn && menu.classList.contains("open")) {
      menu.classList.remove("open");
      toggleBtn.innerHTML = "☰";
    }
  });
}

function setupProfilMenu() {
  document.querySelectorAll(".profil-menu-item[data-target]").forEach(el => {
    el.addEventListener("click", () => {
      const target = document.getElementById(el.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
  const notif = document.getElementById("profilNotifikasi");
  if (notif) notif.addEventListener("click", () => alert("Pengaturan notifikasi akan segera hadir."));
  const bantuan = document.getElementById("profilBantuan");
  if (bantuan) bantuan.addEventListener("click", () => alert("Butuh bantuan? Hubungi tim IzyAnalisaAI melalui chat AI di pojok kanan bawah."));
  const tentang = document.getElementById("profilTentang");
  if (tentang) tentang.addEventListener("click", () => alert("IzyAnalisaAI - Smart Indonesian Stock Intelligence.\nAnalisa saham BEI berbasis AI Score, RSI, MACD, EMA, Volume, Support & Resistance."));
}

function setupHeatmap() {
  const heatmapEl = document.querySelector(".heatmap");
  if (!heatmapEl) return;
  const overlay = document.createElement("div");
  overlay.className = "sector-modal-overlay";
  overlay.id = "sectorModalOverlay";
  // ... (kode modal heatmap sama persis seperti di app.pdf asli)
}

function setupPremiumModal() {
  const overlay = document.createElement("div");
  overlay.className = "premium-modal-overlay";
  overlay.id = "premiumModalOverlay";
  // ... (kode modal premium sama persis seperti di app.pdf asli)
}

function setupChatWidget() {
  // ... (kode chat widget sama persis seperti di app.pdf asli)
}
