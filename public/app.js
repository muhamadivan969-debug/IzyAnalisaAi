// =========================
// DATA GLOBAL
// =========================
let ihsgData = { value: null, changePercent: null };
let companies = [];

// =========================
// HELPER: UPDATE CHART
// =========================
function updateChart(symbol) {
  const container = document.getElementById("tvchart");
  if (!container) return;

  if (window.tvWidget) {
    try { window.tvWidget.remove(); } catch (e) {}
  }

  container.innerHTML = "";
  window.tvWidget = new TradingView.widget({
    autosize: true,
    symbol: symbol,
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    container_id: "tvchart",
    // Batasi simbol yang muncul di search box (tombol "+") supaya
    // hanya menampilkan saham Bursa Efek Indonesia (IDX), bukan
    // crypto/forex/saham luar negeri.
    symbol_search_request_delay: 300,
    widgetbar: { details: false, news: false },
    overrides: {},
    disabled_features: [
      "header_symbol_search"
    ],
    enabled_features: [],
    // Filter market ke Indonesia Stock Exchange saja
    exchanges: ["IDX"],
    symbol_types: ["stock", "index"]
  });
}

document.addEventListener("DOMContentLoaded", () => {

  const loading = document.getElementById("loading");
  if (loading) {
    setTimeout(() => {
      loading.style.display = "none";
    }, 800);
  }

  const btn = document.getElementById("analyzeButton");
  if (btn) {
    btn.addEventListener("click", analyzeStock);
  }

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

// =========================
// PROFIL MENU
// =========================
function setupProfilMenu() {
  // Item dengan data-target -> scroll ke section terkait
  document.querySelectorAll(".profil-menu-item[data-target]").forEach(el => {
    el.addEventListener("click", () => {
      const target = document.getElementById(el.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  const notif = document.getElementById("profilNotifikasi");
  if (notif) {
    notif.addEventListener("click", () => {
      alert("Pengaturan notifikasi akan segera hadir.");
    });
  }

  const bantuan = document.getElementById("profilBantuan");
  if (bantuan) {
    bantuan.addEventListener("click", () => {
      alert("Butuh bantuan? Hubungi tim IzyAnalisaAI melalui chat AI di pojok kanan bawah.");
    });
  }

  const tentang = document.getElementById("profilTentang");
  if (tentang) {
    tentang.addEventListener("click", () => {
      alert("IzyAnalisaAI — Smart Indonesian Stock Intelligence.\nAnalisa saham BEI berbasis AI Score, RSI, MACD, EMA, Volume, Support & Resistance.");
    });
  }
}

// =========================
// NAVIGASI (Desktop menu + Bottom nav)
// =========================
function setupNavigation() {
  document.querySelectorAll(".menu button[data-target], .bottom-nav a[data-target]")
    .forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = el.getAttribute("data-target");
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
        // Tutup dropdown menu mobile setelah memilih menu
        const menu = document.querySelector(".menu");
        if (menu) menu.classList.remove("open");
      });
    });
}

// =========================
// HAMBURGER MENU (mobile)
// =========================
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

// =========================
// FETCH IHSG
// =========================
async function loadIHSG() {
  try {
    const res = await fetch(`/api/analyze?kode=COMPOSITE`);
    const json = await res.json();
    const d = json.data || json;

    const value = Number(d.close || d.ClosePrice || d.LastPrice || d.value || 0);
    const changePercent = Number(d.changePercent || d.ChangePercent || d.change_percent || d.percent || 0);

    ihsgData = { value, changePercent };

    const ihsgEl = document.getElementById("ihsg");
    const persenEl = document.getElementById("ihsgPersen");

    if (ihsgEl) {
      ihsgEl.textContent = value > 0
        ? value.toLocaleString("id-ID", { maximumFractionDigits: 2 })
        : "N/A";
    }

    if (persenEl) {
      const sign = changePercent >= 0 ? "+" : "";
      persenEl.textContent = `${sign}${changePercent.toFixed(2)}%`;
      persenEl.style.color = changePercent >= 0 ? "var(--green)" : "var(--red)";
    }

  } catch (err) {
    console.error("Gagal memuat IHSG:", err);
    const ihsgEl = document.getElementById("ihsg");
    if (ihsgEl) ihsgEl.textContent = "Error";
  }
}

// =========================
// HITUNG SUPPORT / RESISTANCE & BUY AREA
// =========================
// Catatan penting: perhitungan ini memakai OHLC HARI INI (open/high/low/close)
// karena itulah data yang tersedia dari API saat ini. Untuk akurasi lebih
// tinggi, idealnya support/resistance dihitung dari data historis beberapa
// hari/minggu terakhir (swing high-low), bukan cuma 1 hari. Jika sumber data
// GoAPI menyediakan endpoint riwayat harga, ini bisa ditingkatkan lebih lanjut.
function hitungLevelTrading(open, high, low, close) {
  // Support = area terendah yang "wajar" (low hari ini, dengan sedikit buffer)
  // Resistance = area tertinggi yang "wajar" (high hari ini)
  const support = low;
  const resistance = high;
  const range = Math.max(resistance - support, close * 0.01); // hindari range 0

  // Buy area WAJIB berada di ANTARA support dan close (bukan di atas resistance).
  // Idealnya beli mendekati support, bukan mendekati/di atas resistance.
  let buyLow = support + range * 0.1;
  let buyHigh = support + range * 0.35;

  // Jaga-jaga: buy area tidak boleh melebihi close hari ini (tidak logis
  // menyarankan "buy" di atas harga penutupan sebagai area akumulasi awal)
  if (buyHigh > close) buyHigh = close;
  if (buyLow > buyHigh) buyLow = buyHigh * 0.995;

  // Stop Loss: sedikit di bawah support, supaya ada ruang toleransi noise
  const stopLoss = Math.round(support * 0.985);

  // Take Profit bertingkat menuju resistance dan sedikit di atasnya
  // (breakout target), berbasis range aktual, bukan persentase acak dari close.
  const tp1 = Math.round(close + range * 0.5);
  const tp2 = Math.round(resistance);
  const tp3 = Math.round(resistance + range * 0.3);

  return {
    buy1: Math.round(buyLow),
    buy2: Math.round(buyHigh),
    stopLoss,
    tp1,
    tp2,
    tp3,
    support: Math.round(support),
    resistance: Math.round(resistance)
  };
}

// =========================
// ANALISA SAHAM (SEARCH)
// =========================
async function analyzeStock(kodeOverride) {

  const inputEl = document.getElementById("stockInput");
  const kode = (kodeOverride || inputEl.value).toUpperCase().trim();

  if (kode === "") {
    alert("Masukkan kode saham.");
    return;
  }

  if (!/^[A-Z]{3,5}$/.test(kode)) {
    alert("Kode saham tidak valid. Contoh: BBRI, BMRI, TLKM");
    return;
  }

  const btn = document.getElementById("analyzeButton");
  const originalText = btn.textContent;
  btn.textContent = "Menganalisa...";
  btn.disabled = true;

  try {

    const res = await fetch(`/api/analyze?kode=${kode}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    const d = json.data || json;

    if (!d || Object.keys(d).length === 0) {
      alert("Saham tidak ditemukan.");
      return;
    }

    const close = Number(d.close || d.ClosePrice || d.LastPrice || d.last_price || 0);
    const open = Number(d.open || d.OpenPrice || close);
    const high = Number(d.high || d.HighPrice || close);
    const low = Number(d.low || d.LowPrice || close);
    const volume = Number(d.volume || d.Volume || 0);

    if (close === 0) {
      alert("Data harga tidak tersedia untuk saham ini.");
      return;
    }

    let bullish = 50;
    let alasan = [];

    if (close > open) {
      bullish += 15;
      alasan.push("Harga close lebih tinggi dari open (momentum positif)");
    } else {
      alasan.push("Harga close lebih rendah dari open (momentum lemah)");
    }

    if (close >= high * 0.98) {
      bullish += 10;
      alasan.push("Harga mendekati level tertinggi hari ini");
    }

    if (close <= low * 1.02) {
      bullish -= 10;
      alasan.push("Harga mendekati level terendah hari ini");
    }

    if (bullish > 95) bullish = 95;
    if (bullish < 5) bullish = 5;

    const bearish = 100 - bullish;
    const confidence = bullish;

    let signal = "HOLD";
    if (bullish >= 75) signal = "STRONG BUY";
    else if (bullish >= 60) signal = "BUY";
    else if (bullish <= 35) signal = "SELL";

    const lvl = hitungLevelTrading(open, high, low, close);

    updateChart("IDX:" + kode);

    document.getElementById("analysisCard").innerHTML = `
      <h2>${kode} <span class="badge ${signal === 'STRONG BUY' || signal === 'BUY' ? 'buy' : signal === 'SELL' ? 'sell' : 'hold'}">${signal}</span></h2>

      <div class="analysis-grid">
        <div><p>Harga</p><h3>Rp ${close.toLocaleString("id-ID")}</h3></div>
        <div><p>Bullish</p><h3 class="green">${bullish}%</h3></div>
        <div><p>Bearish</p><h3 class="red">${bearish}%</h3></div>
        <div><p>Confidence</p><h3>${confidence}%</h3></div>
      </div>

      <hr>

      <div class="signal-grid">
        <div><p>Support</p><h3>Rp ${lvl.support.toLocaleString("id-ID")}</h3></div>
        <div><p>Resistance</p><h3>Rp ${lvl.resistance.toLocaleString("id-ID")}</h3></div>
        <div><p>BUY AREA</p><h3>Rp ${lvl.buy1.toLocaleString("id-ID")} - Rp ${lvl.buy2.toLocaleString("id-ID")}</h3></div>
        <div><p>STOP LOSS</p><h3 class="red">Rp ${lvl.stopLoss.toLocaleString("id-ID")}</h3></div>
        <div><p>TP1</p><h3 class="green">Rp ${lvl.tp1.toLocaleString("id-ID")}</h3></div>
        <div><p>TP2</p><h3 class="green">Rp ${lvl.tp2.toLocaleString("id-ID")}</h3></div>
        <div><p>TP3</p><h3 class="green">Rp ${lvl.tp3.toLocaleString("id-ID")}</h3></div>
      </div>

      <div style="margin-top:18px;padding:15px;background:#10192d;border-radius:12px;">
        <p style="color:var(--text2);font-size:13px;margin-bottom:8px;font-weight:600;">💡 Alasan AI:</p>
        <ul style="color:var(--text2);font-size:13px;padding-left:18px;line-height:1.8;">
          ${alasan.map(a => `<li>${a}</li>`).join("")}
        </ul>
      </div>

      <p style="margin-top:15px;color:var(--text2);font-size:12px;">
        Volume: ${volume.toLocaleString("id-ID")}
      </p>

      <button id="backToIHSG" style="margin-top:12px;width:100%;background:#1b2644;border:1px solid rgba(255,255,255,.1);padding:10px;border-radius:10px;color:var(--text2);cursor:pointer;font-size:13px;">
        ⬅️ Kembali ke Chart IHSG
      </button>

      <p style="margin-top:15px;padding:12px;background:rgba(255,201,60,.1);border-radius:10px;color:var(--yellow);font-size:12px;text-align:center;">
        ⚠️ DYOR (Do Your Own Research) - Ini bukan saran finansial. Confidence Score menunjukkan keyakinan model, bukan jaminan hasil. Support/Resistance dihitung dari data 1 hari terakhir.
      </p>
    `;

    document.getElementById("analysisCard").scrollIntoView({ behavior: "smooth" });

    const backBtn = document.getElementById("backToIHSG");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        updateChart("IDX:COMPOSITE");
        document.getElementById("tvchart").scrollIntoView({ behavior: "smooth" });
      });
    }

  } catch (err) {
    console.error(err);
    alert("API gagal dihubungi. Cek koneksi atau coba lagi nanti.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }

}

// =========================
// LOAD TOP GAINERS, LOSERS, TOP PICK
// =========================
async function loadMarketMovers() {
  try {
    const res = await fetch(`/api/analyze?list=true`);
    const json = await res.json();
    const data = json.data || [];

    if (data.length === 0) return;

    data.forEach(item => {
      if (item.changePercent === 0 && item.open > 0) {
        item.changePercent = ((item.close - item.open) / item.open) * 100;
      }
    });

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
          <li>🚀 ${item.kode} <span class="green">${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%</span></li>
        `).join("")}
      </ul>
    </div>

    <div class="market-card">
      <h2>📉 Top Losers</h2>
      <ul>
        ${losers.map(item => `
          <li>🔻 ${item.kode} <span class="red">${item.changePercent.toFixed(2)}%</span></li>
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

  // Klik card top pick -> langsung analisa saham itu
  stockGrid.querySelectorAll(".stock-card").forEach(card => {
    card.addEventListener("click", () => {
      const kode = card.getAttribute("data-kode");
      document.getElementById("stockInput").value = kode;
      document.getElementById("searchSection").scrollIntoView({ behavior: "smooth" });
      analyzeStock(kode);
    });
  });
}

// =========================
// AUTOCOMPLETE SEMUA EMITEN BEI
// =========================
async function loadCompanies() {
  const cached = localStorage.getItem("companies");
  const cachedAt = Number(localStorage.getItem("companiesAt") || 0);
  if (cached && Date.now() - cachedAt < 86400000) {
    companies = JSON.parse(cached);
    return;
  }
  try {
    const res = await fetch(`/api/analyze?companies=true`);
    const json = await res.json();
    companies = json.data || [];
    localStorage.setItem("companies", JSON.stringify(companies));
    localStorage.setItem("companiesAt", Date.now());
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
      (c.symbol && c.symbol.includes(q)) || (c.name && c.name.toUpperCase().includes(q))
    ).slice(0, 8);

    if (results.length === 0) { box.style.display = "none"; return; }

    box.innerHTML = results.map(c => `
      <div class="ac-item" data-symbol="${c.symbol}"
        style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,.05);color:#e5e9f5;">
        <b>${c.symbol}</b> <span style="color:#8b9bb4;">— ${c.name}</span>
      </div>`).join("");
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

// =========================
// HEATMAP SEKTOR (klik untuk lihat semua saham di sektor)
// =========================
function setupHeatmap() {
  const heatmapEl = document.querySelector(".heatmap");
  if (!heatmapEl) return;

  // Bikin modal overlay sekali di awal
  const overlay = document.createElement("div");
  overlay.className = "sector-modal-overlay";
  overlay.id = "sectorModalOverlay";
  overlay.innerHTML = `
    <div class="sector-modal">
      <div class="sector-modal-header">
        <h3 id="sectorModalTitle">Sektor</h3>
        <span id="sectorModalClose">✕</span>
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

  // Setiap kotak sektor jadi bisa diklik
  heatmapEl.querySelectorAll(".heat").forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => openSectorModal(el.textContent.trim()));
  });
}

async function openSectorModal(sectorName) {
  const overlay = document.getElementById("sectorModalOverlay");
  const title = document.getElementById("sectorModalTitle");
  const list = document.getElementById("sectorModalList");

  title.textContent = `🌡️ Sektor ${sectorName}`;
  list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--text2);">Memuat data saham ${sectorName}...</p>`;
  overlay.classList.add("open");

  try {
    const res = await fetch(`/api/sector?name=${encodeURIComponent(sectorName)}`);
    const json = await res.json();
    const data = json.data || [];

    if (data.length === 0) {
      list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--text2);">Data saham untuk sektor ini belum tersedia.</p>`;
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

  } catch (err) {
    console.error("Gagal load data sektor:", err);
    list.innerHTML = `<p style="text-align:center;padding:20px;color:var(--red);">Gagal memuat data. Coba lagi nanti.</p>`;
  }
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
      // TODO: arahkan ke halaman/payment gateway sungguhan saat sudah siap
      alert(`Kamu memilih paket ${plan}. Fitur pembayaran akan segera hadir.`);
    });
  });

  // Attach ke semua tombol "Upgrade Premium" (banner + section premium)
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
    .ai-msg table { width:100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
    .ai-msg th, .ai-msg td { border: 1px solid rgba(255,255,255,.1); padding: 8px; text-align: left; }
    .ai-msg th { background: #1b2644; }
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
    loadingBubble.textContent = "Menganalisa data...";
    messagesDiv.appendChild(loadingBubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    let context = {
      ihsg: ihsgData.value ? ihsgData.value.toLocaleString("id-ID") : "tidak tersedia",
      ihsgPersen: ihsgData.changePercent !== null ? (ihsgData.changePercent >= 0 ? "+" : "") + ihsgData.changePercent.toFixed(2) + "%" : "tidak tersedia",
      waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };

    const kodeSahamMatch = message.toUpperCase().match(/\b[A-Z]{3,5}\b/g);
    const kataUmum = ["IHSG", "BESOK", "HARI", "INI", "APA", "GIMANA", "BAGAIMANA", "KAPAN", "YANG", "DAN", "ATAU", "DARI", "UNTUK", "SAHAM", "MARKET", "NAIK", "TURUN"];
    const kemungkinanSaham = kodeSahamMatch
      ? kodeSahamMatch.filter(k => !kataUmum.includes(k))
      : [];

    if (kemungkinanSaham.length > 0) {
      const kodeSaham = kemungkinanSaham[0];
      loadingBubble.textContent = `Mengambil data ${kodeSaham}...`;

      try {
        const stockRes = await fetch(`/api/analyze?kode=${kodeSaham}`);
        const stockJson = await stockRes.json();
        const d = stockJson.data || stockJson;

        if (d && Object.keys(d).length > 0) {
          const close = Number(d.close || d.ClosePrice || d.LastPrice || 0);
          const open = Number(d.open || d.OpenPrice || close);
          const high = Number(d.high || d.HighPrice || close);
          const low = Number(d.low || d.LowPrice || close);
          const volume = Number(d.volume || d.Volume || 0);

          if (close > 0) {
            context.saham = {
              kode: kodeSaham,
              close: close,
              open: open,
              high: high,
              low: low,
              volume: volume,
              perubahan: (((close - open) / open) * 100).toFixed(2) + "%"
            };
          }
        }
      } catch (err) {
        console.error("Gagal fetch data saham untuk chat:", err);
      }
    }

    loadingBubble.textContent = "Menganalisa...";

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
