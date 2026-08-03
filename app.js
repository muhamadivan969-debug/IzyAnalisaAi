const API_KEY = "cbe37ed3-0127-568e-7aff-c15a5f7b";
const BASE_URL = "https://api.goapi.io/stock/idx";

document.addEventListener("DOMContentLoaded", () => {

  // Sembunyikan loading spinner
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

  // Menu navigasi (scroll ke section)
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

  // Inisialisasi TradingView Chart
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

  // Load data IHSG saat halaman dibuka
  loadIHSG();

});

// =========================
// FETCH IHSG (Composite Index)
// =========================
async function loadIHSG() {
  try {
    const res = await fetch(`${BASE_URL}/COMPOSITE`, {
      headers: { "X-API-KEY": API_KEY }
    });

    const json = await res.json();
    const d = json.data || json;

    const value = Number(d.ClosePrice || d.LastPrice || d.close || d.value || 0);
    const change = Number(d.Change || d.change || 0);
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
// ANALISA SAHAM
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

    const res = await fetch(`${BASE_URL}/${kode}`, {
      headers: { "X-API-KEY": API_KEY }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    const d = json.data || json;

    if (!d || Object.keys(d).length === 0) {
      alert("Saham tidak ditemukan.");
      return;
    }

    // Fleksibel terhadap berbagai kemungkinan nama field
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
    if (close > open) bullish += 15;
    if (close >= high * 0.98) bullish += 10;
    if (close <= low * 1.02) bullish -= 10;
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

    // Update chart TradingView sesuai saham yang dicari
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
        <div>
          <p>Harga</p>
          <h3>Rp ${close.toLocaleString("id-ID")}</h3>
        </div>
        <div>
          <p>Bullish</p>
          <h3 class="green">${bullish}%</h3>
        </div>
        <div>
          <p>Bearish</p>
          <h3 class="red">${bearish}%</h3>
        </div>
        <div>
          <p>Confidence</p>
          <h3>${confidence}%</h3>
        </div>
      </div>

      <hr>

      <div class="signal-grid">
        <div>
          <p>BUY AREA</p>
          <h3>Rp ${buy1.toLocaleString("id-ID")} - Rp ${buy2.toLocaleString("id-ID")}</h3>
        </div>
        <div>
          <p>STOP LOSS</p>
          <h3>Rp ${sl.toLocaleString("id-ID")}</h3>
        </div>
        <div>
          <p>TP1</p>
          <h3>Rp ${tp1.toLocaleString("id-ID")}</h3>
        </div>
        <div>
          <p>TP2</p>
          <h3>Rp ${tp2.toLocaleString("id-ID")}</h3>
        </div>
        <div>
          <p>TP3</p>
          <h3>Rp ${tp3.toLocaleString("id-ID")}</h3>
        </div>
      </div>

      <p style="margin-top:15px;color:var(--text2);font-size:13px;">
        Volume: ${volume.toLocaleString("id-ID")}
      </p>
    `;

    document.getElementById("analysisCard").scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    console.error(err);
    alert("API gagal dihubungi. Cek koneksi atau API key.");
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }

}
