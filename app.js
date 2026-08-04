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

  window.tvWidget = new TradingView.widget({
    autosize: true,
    symbol: "IDX:BBRI",
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    container_id: "tvchart"
  });

  loadIHSG();
  loadMarketMovers();
  setupChatWidget();

});

// =========================
// FETCH IHSG
// =========================
async function loadIHSG() {
  try {
    const res = await fetch(`/api/analyze?kode=COMPOSITE`);
    const json = await res.json();
    const d = json.data || json;

    const value = Number(d.ClosePrice || d.LastPrice || d.close || d.value || 0);
    const changePercent = Number(d.ChangePercent || d.change_percent || d.percent || 0);

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

    const close = Number(d.ClosePrice || d.LastPrice || d.close || d.last_price || 0);
    const open = Number(d.OpenPrice || d.open || close);
    const high = Number(d.HighPrice || d.high || close);
    const low = Number(d.LowPrice || d.low || close);
    const volume = Number(d.Volume || d.volume || 0);

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

    document.getElementById("tvchart").innerHTML = "";
    window.tvWidget = new TradingView.widget({
      autosize: true,
      symbol: "IDX:" + kode,
      interval: "D",
      timezone: "Asia/Jakarta",
      theme: "dark",
      style: "1",
      locale: "id",
      container_id: "tvchart"
    });

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

      <p style="margin-top:15px;padding:12px;background:rgba(255,201,60,.1);border-radius:10px;color:var(--yellow);font-size:12px;text-align:center;">
        ⚠️ DYOR (Do Your Own Research) - Ini bukan saran finansial. Confidence Score menunjukkan keyakinan model, bukan jaminan hasil.
      </p>
    `;

    document.getElementById("analysisCard").scrollIntoView({ behavior: "smooth" });

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
// AI CHAT WIDGET
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
    transition: .25s;
  `;
  document.body.appendChild(chatButton);

  const chatPanel = document.createElement("div");
  chatPanel.id = "chatPanel";
  chatPanel.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100%;
    max-width: 400px;
    height: 70vh;
    background: #151d33;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 40px rgba(0,0,0,.5);
    z-index: 1001;
    display: none;
    flex-direction: column;
    overflow: hidden;
  `;

  chatPanel.innerHTML = `
    <div style="padding:16px;background:#10192d;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.06);">
      <strong style="color:#00C2FF;">🤖 AI Chat - IzyAnalisaAI</strong>
      <span id="closeChatBtn" style="cursor:pointer;font-size:20px;color:#aeb7d1;">✕</span>
    </div>
    <div id="chatMessages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
      <div style="background:#1b2644;padding:12px 15px;border-radius:14px;color:#aeb7d1;font-size:14px;">
        Halo! Saya AI analis IzyAnalisaAI. Tanya apa saja soal saham atau IHSG, contoh: "Gimana arah IHSG besok?" atau "BBRI potensi naik ga?"
      </div>
    </div>
    <div style="padding:14px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:10px;">
      <input id="chatInput" type="text" placeholder="Tanya AI..." style="flex:1;background:#0f172a;border:none;padding:12px;border-radius:12px;color:white;outline:none;">
      <button id="chatSendBtn" style="background:#00C2FF;border:none;padding:12px 18px;border-radius:12px;color:#081018;font-weight:700;cursor:pointer;">Kirim</button>
    </div>
  `;

  document.body.appendChild(chatPanel);

  chatButton.addEventListener("click", () => {
    chatPanel.style.display = chatPanel.style.display === "none" ? "flex" : "none";
  });

  document.getElementById("closeChatBtn").addEventListener("click", () => {
    chatPanel.style.display = "none";
  });

  const sendMessage = async () => {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    const messagesDiv = document.getElementById("chatMessages");

    messagesDiv.innerHTML += `
      <div style="background:#00C2FF;color:#081018;padding:12px 15px;border-radius:14px;font-size:14px;align-self:flex-end;max-width:80%;">
        ${message}
      </div>
    `;

    input.value = "";
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const loadingId = "loading-" + Date.now();
    messagesDiv.innerHTML += `
      <div id="${loadingId}" style="background:#1b2644;padding:12px 15px;border-radius:14px;color:#aeb7d1;font-size:14px;">
        Mengetik...
      </div>
    `;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const json = await res.json();
      const reply = json.reply || "Maaf, terjadi kesalahan.";

      document.getElementById(loadingId).remove();

      messagesDiv.innerHTML += `
        <div style="background:#1b2644;padding:12px 15px;border-radius:14px;color:white;font-size:14px;white-space:pre-wrap;">
          ${reply}
        </div>
      `;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

    } catch (err) {
      console.error(err);
      document.getElementById(loadingId).remove();
      messagesDiv.innerHTML += `
        <div style="background:#ff4d5a;padding:12px 15px;border-radius:14px;color:white;font-size:14px;">
          Gagal menghubungi AI. Coba lagi nanti.
        </div>
      `;
    }
  };

  document.getElementById("chatSendBtn").addEventListener("click", sendMessage);
  document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

}
