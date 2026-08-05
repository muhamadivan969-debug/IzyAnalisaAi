// ======================
// GLOBAL
// ======================
let currentSymbol = "IDX:COMPOSITE";

// ======================
// MOBILE MENU
// ======================
function setupMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("drawerOverlay");
  const closeBtn = document.getElementById("closeDrawer");

  if (!toggle || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", openDrawer);
  closeBtn?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  drawer.querySelectorAll("button[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeDrawer();
      const target = btn.getAttribute("data-target");
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ======================
// NAVIGATION
// ======================
function setupNavigation() {
  document.querySelectorAll("[data-target]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const target = el.getAttribute("data-target");
      const section = document.getElementById(target);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }

      document.querySelectorAll(".bottom-nav a").forEach((a) => a.classList.remove("active"));
      if (el.closest(".bottom-nav")) {
        el.classList.add("active");
      }
    });
  });
}

// ======================
// HEATMAP
// ======================
function setupHeatmap() {
  document.querySelectorAll(".heat").forEach((el) => {
    el.addEventListener("click", () => {
      const sector = el.getAttribute("data-sector") || el.textContent;
      alert("Sektor: " + sector + "\n\nFitur detail sektor akan segera tersedia.");
    });
  });
}

// ======================
// PREMIUM
// ======================
function setupPremium() {
  const btn = document.getElementById("upgradePremiumBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      alert("Fitur Premium akan segera tersedia.\nHubungi admin untuk upgrade.");
    });
  }
}

// ======================
// TRADINGVIEW CHART
// ======================
function updateChart(symbol) {
  const container = document.getElementById("tvchart");
  if (!container || typeof TradingView === "undefined") return;

  container.innerHTML = "";
  currentSymbol = symbol || "IDX:COMPOSITE";

  new TradingView.widget({
    container_id: "tvchart",
    autosize: true,
    symbol: currentSymbol,
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    toolbar_bg: "#0a0e1a",
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    backgroundColor: "#0a0e1a",
    gridColor: "rgba(255,255,255,0.05)",
  });
}

// ======================
// LOAD IHSG
// ======================
async function loadIHSG() {
  try {
    const res = await fetch("/api/saham?kode=COMPOSITE");
    const json = await res.json();

    if (!res.ok || !json.data) {
      document.getElementById("ihsg").textContent = "Error";
      return;
    }

    const data = json.data;
    const el = document.getElementById("ihsg");
    const persenEl = document.getElementById("ihsgPersen");

    if (el) el.textContent = data.close ? data.close.toLocaleString("id-ID") : "-";
    if (persenEl) {
      const pct = data.changePercent || 0;
      persenEl.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
      persenEl.style.color = pct >= 0 ? "#00D26A" : "#FF4D5A";
    }
  } catch (err) {
    console.error("loadIHSG error:", err);
    document.getElementById("ihsg").textContent = "Error";
  }
}

// ======================
// LOAD MARKET MOVERS
// ======================
async function loadMarketMovers() {
  try {
    const res = await fetch("/api/summary");
    const json = await res.json();

    if (!res.ok || !json.data) {
      document.getElementById("gainersList").innerHTML = "<li>Data tidak tersedia</li>";
      document.getElementById("losersList").innerHTML = "<li>Data tidak tersedia</li>";
      return;
    }

    const list = json.data;
    const gainers = list.slice(0, 5);
    const losers = list.slice(-5).reverse();

    const gainersEl = document.getElementById("gainersList");
    const losersEl = document.getElementById("losersList");

    if (gainersEl) {
      gainersEl.innerHTML = gainers
        .map(
          (s) =>
            `<li style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span>${s.kode}</span>
              <span style="color:#00D26A">+${Number(s.changePercent).toFixed(2)}%</span>
            </li>`
        )
        .join("");
    }

    if (losersEl) {
      losersEl.innerHTML = losers
        .map(
          (s) =>
            `<li style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span>${s.kode}</span>
              <span style="color:#FF4D5A">${Number(s.changePercent).toFixed(2)}%</span>
            </li>`
        )
        .join("");
    }

    // Top Pick sederhana
    const topPickGrid = document.getElementById("topPickGrid");
    if (topPickGrid && gainers.length > 0) {
      topPickGrid.innerHTML = gainers
        .slice(0, 3)
        .map(
          (s) => `
        <div class="stock-card">
          <div>
            <h3>${s.kode}</h3>
            <p>${s.name || ""}</p>
            <div class="price">${s.close ? Number(s.close).toLocaleString("id-ID") : "-"}</div>
            <span class="badge buy">+${Number(s.changePercent).toFixed(2)}%</span>
          </div>
        </div>
      `
        )
        .join("");
    }
  } catch (err) {
    console.error("loadMarketMovers error:", err);
  }
}

// ======================
// ANALISA SAHAM
// ======================
async function analyzeStock() {
  const input = document.getElementById("stockInput");
  const card = document.getElementById("analysisCard");
  if (!input || !card) return;

  const kode = input.value.trim().toUpperCase();
  if (!kode) {
    alert("Masukkan kode saham dulu");
    return;
  }

  card.innerHTML = `<p style="text-align:center;padding:30px 0;opacity:.7">Mengambil data ${kode}...</p>`;

  try {
    const res = await fetch("/api/saham?kode=" + kode);
    const json = await res.json();

    if (!res.ok || !json.data) {
      card.innerHTML = `<p style="text-align:center;padding:30px 0;color:#FF4D5A">${json.error || "Gagal mengambil data"}</p>`;
      return;
    }

    const d = json.data;
    const pct = d.changePercent || 0;
    const color = pct >= 0 ? "#00D26A" : "#FF4D5A";
    const sign = pct >= 0 ? "+" : "";

    // Update chart
    updateChart("IDX:" + kode);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h2 style="font-size:26px;margin-bottom:4px">${d.kode}</h2>
          <p style="color:var(--text2);font-size:13px">${d.name || ""}</p>
        </div>
        <span class="badge \( {pct >= 0 ? "buy" : "sell"}"> \){sign}${pct.toFixed(2)}%</span>
      </div>

      <div class="price" style="color:\( {color}"> \){Number(d.close).toLocaleString("id-ID")}</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px;font-size:13px">
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px">
          <div style="color:var(--text2);margin-bottom:4px">Open</div>
          <div style="font-weight:600">${Number(d.open).toLocaleString("id-ID")}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px">
          <div style="color:var(--text2);margin-bottom:4px">High</div>
          <div style="font-weight:600">${Number(d.high).toLocaleString("id-ID")}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px">
          <div style="color:var(--text2);margin-bottom:4px">Low</div>
          <div style="font-weight:600">${Number(d.low).toLocaleString("id-ID")}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:12px;border-radius:12px">
          <div style="color:var(--text2);margin-bottom:4px">Volume</div>
          <div style="font-weight:600">${Number(d.volume).toLocaleString("id-ID")}</div>
        </div>
      </div>

      <div style="margin-top:20px;padding:14px;background:rgba(0,194,255,0.08);border-radius:12px;border:1px solid rgba(0,194,255,0.2)">
        <div style="font-size:13px;color:var(--primary);font-weight:600;margin-bottom:6px">AI Insight</div>
        <div style="font-size:13px;line-height:1.5;color:var(--text2)">
          Data berdasarkan penutupan terakhir. Untuk analisa lebih mendalam (Support, Resistance, Buy Area, RSI, MACD) segera tersedia di versi Premium.
        </div>
      </div>
    `;
  } catch (err) {
    console.error("analyzeStock error:", err);
    card.innerHTML = `<p style="text-align:center;padding:30px 0;color:#FF4D5A">Terjadi kesalahan. Coba lagi.</p>`;
  }
}

// ======================
// INIT
// ======================
document.addEventListener("DOMContentLoaded", () => {
  // Hide loading
  const loading = document.getElementById("loading");
  if (loading) {
    setTimeout(() => {
      loading.style.display = "none";
    }, 700);
  }

  setupMobileMenu();
  setupNavigation();
  setupHeatmap();
  setupPremium();

  // Chart
  setTimeout(() => {
    updateChart("IDX:COMPOSITE");
  }, 500);

  // Data
  loadIHSG();
  loadMarketMovers();

  // Analisa button
  const btn = document.getElementById("analyzeButton");
  if (btn) {
    btn.addEventListener("click", analyzeStock);
  }

  // Enter key
  const input = document.getElementById("stockInput");
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") analyzeStock();
    });
  }
});
