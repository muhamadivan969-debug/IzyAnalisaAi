// ======================
// DATA GLOBAL
// ======================
let ihsgData = { value: null, changePercent: null };
let companies = [];

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

async function loadIHSG() {
  try {
    const res = await fetch('/api/saham?kode=COMPOSITE');
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

async function loadMarketMovers() {
  try {
    const res = await fetch('/api/summary');
    const json = await res.json();
    const data = json.data || [];
    
    if (data.length === 0) return;

    const gainers = [...data].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const losers = [...data].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    renderGainersLosers(gainers, losers);
    renderTopPick(data);
  } catch (err) {
    console.error("Gagal load market movers:", err);
  }
}

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

function renderTopPick(data) {
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

  stockGrid.querySelectorAll(".stock-card").forEach(card => {
    card.addEventListener("click", () => {
      const kode = card.getAttribute("data-kode");
      document.getElementById("stockInput").value = kode;
      document.getElementById("searchSection").scrollIntoView({ behavior: "smooth" });
      analyzeStock(kode);
    });
  });
}

async function loadCompanies() {
  const cached = localStorage.getItem("companies");
  const cachedAt = Number(localStorage.getItem("companiesAt") || 0);
  if (cached && Date.now() - cachedAt < 86400000) {
    companies = JSON.parse(cached);
    return;
  }
  try {
    const res = await fetch(`/api/saham?companies=true`);
    const json = await res.json();
    companies = json.data || [];
    if (companies.length > 0) {
      localStorage.setItem("companies", JSON.stringify(companies));
      localStorage.setItem("companiesAt", Date.now());
    }
  } catch (err) {
    console.error("Gagal load daftar emiten:", err);
  }
}

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

// =========================
// HEATMAP SEKTOR (klik untuk lihat semua saham di sektor)
// =========================
function setupHeatmap() {
  const heatmapEl = document.querySelector(".heatmap");
  if (!heatmapEl) return;

  const overlay = document.createElement("div");
  overlay.className = "sector-modal-overlay";
  overlay.id = "sectorModalOverlay";
  overlay.innerHTML = `
    <div class="sector-modal">
      <div class="sector-modal-header">
        <h3 id="sectorModalTitle">Sektor</h3>
        <span id="sectorModalClose">✕</span>
      </div>
      <div style="padding:0 14px 10px;">
        <input id="sectorSearchInput" type="text" placeholder="Cari kode atau nama saham..."
          style="width:100%;background:#151d33;border:1px solid rgba(255,255,255,.1);padding:11px 14px;border-radius:12px;color:white;outline:none;font-size:14px;">
      </div>
      <div class="sector-modal-list" id="sectorModalList">
        <p style="text-align:center;padding:20px;color:var(--text2);">Memuat data...</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
  document.getElementById("sectorModalClose").addEventListener("click", () => {
    overlay.classList.remove("open");
  });
  document.getElementById("sectorSearchInput").addEventListener("input", (e) => {
    filterSectorList(e.target.value);
  });

  heatmapEl.querySelectorAll(".heat").forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => openSectorModal(el.textContent.trim()));
  });
}

let currentSectorData = [];

async function openSectorModal(sectorName) {
  const overlay = document.getElementById("sectorModalOverlay");
  const title = document.getElementById("sectorModalTitle");
  const list = document.getElementById("sectorModalList");
  const searchInput = document.getElementById("sectorSearchInput");

  title.textContent = `🌡️ Sektor ${sectorName}`;
  searchInput.value = "";
  list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--text2);">Memuat data saham ${sectorName}...</p>`;
  overlay.classList.add("open");

  try {
    const res = await fetch(`/api/sector?name=${encodeURIComponent(sectorName)}`);
    const json = await res.json();
    const data = json.data || [];

    currentSectorData = data;

    if (data.length === 0) {
      list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--text2);">Data saham untuk sektor ini belum tersedia.</p>`;
      return;
    }

    renderSectorList(data);

  } catch (err) {
    console.error("Gagal load data sektor:", err);
    list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--red);">Gagal memuat data. Coba lagi nanti.</p>`;
  }
}

function renderSectorList(data) {
  const list = document.getElementById("sectorModalList");
  const overlay = document.getElementById("sectorModalOverlay");

  if (data.length === 0) {
    list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--text2);">Tidak ada saham yang cocok.</p>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <div class="sector-stock-row" data-kode="${item.symbol}">
      <div>
        <div class="kode">${item.symbol}</div>
        <div class="nama">${item.name}</div>
      </div>
      <div class="harga">
        ${item.available
          ? `<div>Rp ${item.close.toLocaleString("id-ID")}</div><div class="${item.changePercent >= 0 ? 'green' : 'red'}" style="font-size:12px;">${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%</div>`
          : `<div style="color:var(--text2);font-size:12px;">N/A</div>`}
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".sector-stock-row").forEach(row => {
    row.addEventListener("click", () => {
      const kode = row.getAttribute("data-kode");
      overlay.classList.remove("open");
      document.getElementById("stockInput").value = kode;
      document.getElementById("searchSection").scrollIntoView({ behavior: "smooth" });
      analyzeStock(kode);
    });
  });
}

function filterSectorList(query) {
  const q = query.toUpperCase().trim();
  if (!q) {
    renderSectorList(currentSectorData);
    return;
  }
  const filtered = currentSectorData.filter(item =>
    item.symbol.toUpperCase().includes(q) || item.name.toUpperCase().includes(q)
  );
  renderSectorList(filtered);
}

// =========================
// PREMIUM MODAL
// =========================
function setupPremiumModal() {
  const overlay = document.createElement("div");
  overlay.className = "premium-modal-overlay";
  overlay.id = "premiumModalOverlay";
  overlay.innerHTML = `
    <div class="premium-modal">
      <span class="close-x" id="premiumModalClose">✕</span>
      <h3>⭐ Upgrade ke Premium</h3>
      <p style="color:var(--text2);font-size:13px;margin-top:6px;">Pilih paket yang sesuai kebutuhan trading kamu.</p>

      <div class="plan-option" data-plan="bulanan">
        <div class="plan-title">Bulanan</div>
        <div class="plan-price">Rp99.000 / bulan</div>
        <ul>
          <li>AI Scanner & Trading Plan</li>
          <li>Support Resistance, Buy Area, SL, TP1-TP3</li>
          <li>Bandarmology & AI Chat</li>
        </ul>
      </div>

      <div class="plan-option" data-plan="tahunan">
        <div class="plan-title">Tahunan (Hemat 30%)</div>
        <div class="plan-price">Rp799.000 / tahun</div>
        <ul>
          <li>Semua fitur paket Bulanan</li>
          <li>Prioritas fitur baru</li>
          <li>Grup diskusi khusus member</li>
        </ul>
      </div>

      <p style="text-align:center;color:var(--text2);font-size:12px;margin-top:16px;">
        Pembayaran akan diarahkan ke halaman checkout.
      </p>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
  document.getElementById("premiumModalClose").addEventListener("click", () => {
    overlay.classList.remove("open");
  });

  overlay.querySelectorAll(".plan-option").forEach(el => {
    el.addEventListener("click", () => {
      const plan = el.getAttribute("data-plan");
      alert(`Kamu memilih paket ${plan}. Fitur pembayaran akan segera hadir.`);
    });
  });

  document.querySelectorAll(".premium-banner button").forEach(btn => {
    btn.addEventListener("click", () => {
      overlay.classList.add("open");
    });
  });
}

// =========================
// AI CHAT WIDGET (FULL SCREEN)
// =========================
function setupChatWidget() {

  const chatButton = document.createElement("div");
  chatButton.id = "chatFloatBtn";
  chatButton.innerHTML = "🤖";
  chatButton.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg,#00C2FF,#00E5A8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0,194,255,.4);
    z-index: 1000;
  `;
  document.body.appendChild(chatButton);

  const chatPanel = document.createElement("div");
  chatPanel.id = "chatPanel";
  chatPanel.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #05070d;
    z-index: 2000;
    display: none;
    flex-direction: column;
  `;

  chatPanel.innerHTML = `
    <div style="padding:18px 16px;background:#0a0e1a;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.08);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">🔴👁️</span>
        <strong style="color:#00C2FF;font-size:17px;">IzyAI Analyst</strong>
      </div>
      <span id="closeChatBtn" style="cursor:pointer;font-size:24px;color:#aeb7d1;padding:5px;">✕</span>
    </div>

    <div id="chatMessages" style="flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px;">
      <div class="ai-msg">
        Halo! Silakan tanya di IzyAnalisaAI ya kak ^__^
        <br><br>
        Ada pertanyaan tentang IHSG? Atau ada emiten yang mau kamu analisa?
      </div>
    </div>

    <div style="padding:14px 16px;border-top:1px solid rgba(255,255,255,.08);background:#0a0e1a;display:flex;gap:10px;align-items:center;">
      <input id="chatInput" type="text" placeholder="Tanyakan apa saja..." style="flex:1;background:#151d33;border:none;padding:14px 16px;border-radius:24px;color:white;outline:none;font-size:15px;">
      <button id="chatSendBtn" style="background:linear-gradient(135deg,#00C2FF,#00E5A8);border:none;width:44px;height:44px;border-radius:50%;color:#081018;font-weight:700;cursor:pointer;font-size:18px;flex-shrink:0;">↑</button>
    </div>
  `;

  document.body.appendChild(chatPanel);

  const style = document.createElement("style");
  style.textContent = `
    .user-msg {
      background: linear-gradient(135deg,#00C2FF,#0088CC);
      color: #081018;
      padding: 12px 16px;
      border-radius: 18px 18px 4px 18px;
      font-size: 14px;
      align-self: flex-end;
      max-width: 85%;
      font-weight: 500;
    }
    .ai-msg {
      background: #151d33;
      color: #e5e9f5;
      padding: 14px 16px;
      border-radius: 18px 18px 18px 4px;
      font-size: 14px;
      line-height: 1.7;
      align-self: flex-start;
      max-width: 92%;
      border: 1px solid rgba(255,255,255,.06);
    }
    .ai-msg h2 {
      font-size: 16px;
      color: #00C2FF;
      margin: 14px 0 8px;
      font-weight: 700;
    }
    .ai-msg h2:first-child { margin-top: 0; }
    .ai-msg strong { color: #fff; }
    .ai-msg ul { padding-left: 18px; margin: 8px 0; }
    .ai-msg li { margin-bottom: 6px; }
  `;
  document.head.appendChild(style);

  chatButton.addEventListener("click", () => {
    chatPanel.style.display = "flex";
  });

  document.getElementById("closeChatBtn").addEventListener("click", () => {
    chatPanel.style.display = "none";
  });

  const sendMessage = async () => {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    const messagesDiv = document.getElementById("chatMessages");

    const userBubble = document.createElement("div");
    userBubble.className = "user-msg";
    userBubble.textContent = message;
    messagesDiv.appendChild(userBubble);

    input.value = "";
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const loadingBubble = document.createElement("div");
    loadingBubble.className = "ai-msg";
    loadingBubble.textContent = "Menganalisa...";
    messagesDiv.appendChild(loadingBubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    let context = {
      ihsg: ihsgData.value ? ihsgData.value.toLocaleString("id-ID") : "tidak tersedia",
      ihsgPersen: ihsgData.changePercent !== null ? (ihsgData.changePercent >= 0 ? "+" : "") + ihsgData.changePercent.toFixed(2) + "%" : "tidak tersedia",
      waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context })
      });

      const json = await res.json();
      const reply = json.reply || "Maaf, terjadi kesalahan. Coba tanya lagi ya.";

      loadingBubble.innerHTML = typeof marked !== "undefined" ? marked.parse(reply) : reply;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

    } catch (err) {
      console.error(err);
      loadingBubble.textContent = "Gagal menghubungi AI. Coba lagi nanti.";
    }
  };

  document.getElementById("chatSendBtn").addEventListener("click", sendMessage);
  document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}
