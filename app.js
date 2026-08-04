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
    container_id: "tvchart"
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

  document.querySelectorAll(".menu button[data-target], .bottom-nav a[data-target]")
    .forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = el.getAttribute("data-target");
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

  updateChart("IDX:COMPOSITE");

  loadIHSG();
  loadMarketMovers();
  setupChatWidget();
  loadCompanies().then(setupAutocomplete);

});

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
// ANALISA SAHAM (SEARCH)
// =========================
async function analyzeStock() {

  const kode = document.getElementById("stockInput").value.toUpperCase().trim();

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

    const buy1 = Math.round(close * 0.995);
    const buy2 = Math.round(close * 1.005);
    const sl = Math.round(close * 0.97);
    const tp1 = Math.round(close * 1.03);
    const tp2 = Math.round(close * 1.06);
    const tp3 = Math.round(close * 1.09);

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
        <div><p>BUY AREA</p><h3>Rp ${buy1.toLocaleString("id-ID")} - Rp ${buy2.toLocaleString("id-ID")}</h3></div>
        <div><p>STOP LOSS</p><h3>Rp ${sl.toLocaleString("id-ID")}</h3></div>
        <div><p>TP1</p><h3>Rp ${tp1.toLocaleString("id-ID")}</h3></div>
        <div><p>TP2</p><h3>Rp ${tp2.toLocaleString("id-ID")}</h3></div>
        <div><p>TP3</p><h3>Rp ${tp3.toLocaleString("id-ID")}</h3></div>
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
        ⚠️ DYOR (Do Your Own Research) - Ini bukan saran finansial. Confidence Score menunjukkan keyakinan model, bukan jaminan hasil.
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
    <div class="stock-card">
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
      const reply = json.reply || "Maaf, terjadi kesalahan.";

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
