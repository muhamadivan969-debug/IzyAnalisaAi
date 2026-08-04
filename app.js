// =========================
// LOAD TOP GAINERS, LOSERS, TOP PICK
// =========================
async function loadMarketMovers() {
  try {
    const res = await fetch(`/api/analyze?list=true`);
    const json = await res.json();
    const data = json.data || [];

    if (data.length === 0) return;

    // Hitung perubahan % kalau API tidak kasih changePercent langsung
    data.forEach(item => {
      if (item.changePercent === 0 && item.open > 0) {
        item.changePercent = ((item.close - item.open) / item.open) * 100;
      }
    });

    // Sort untuk Top Gainers (tertinggi ke terendah)
    const gainers = [...data].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);

    // Sort untuk Top Losers (terendah ke tertinggi)
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
  // Hitung confidence score sederhana untuk tiap saham
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

  // Ambil 3 dengan confidence tertinggi
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
