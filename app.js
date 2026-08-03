document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("analyzeButton");
  const input = document.getElementById("stockInput");

  if (btn) {
    btn.addEventListener("click", analyzeStock);
  }

  new TradingView.widget({
    autosize: true,
    symbol: "IDX:BBRI",
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    container_id: "tvchart"
  });

});

async function analyzeStock() {

  const kode = document.getElementById("stockInput").value.toUpperCase();

  if (kode === "") {
    alert("Masukkan kode saham.");
    return;
  }

  try {

    const res = await fetch("https://api.goapi.io/stock/idx/" + kode, {
      headers: {
        "X-API-KEY": "cbe37ed3-0127-568e-7aff-c15a5f7b"
      }
    });

    const json = await res.json();

    if (!json.data) {
      alert("Saham tidak ditemukan.");
      return;
    }

    const d = json.data;
    const close = Number(d.ClosePrice || d.LastPrice || 0);
const open = Number(d.OpenPrice || close);
const high = Number(d.HighPrice || close);
const low = Number(d.LowPrice || close);
const volume = Number(d.Volume || 0);

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
const result = `
==========================
${kode}
==========================

Harga : Rp ${close.toLocaleString("id-ID")}

Signal AI : ${signal}

Bullish : ${bullish}%
Bearish : ${bearish}%
Confidence : ${confidence}%

BUY AREA
Rp ${buy1.toLocaleString("id-ID")}
-
Rp ${buy2.toLocaleString("id-ID")}

STOP LOSS
Rp ${sl.toLocaleString("id-ID")}

TARGET PROFIT

TP1 : Rp ${tp1.toLocaleString("id-ID")}
TP2 : Rp ${tp2.toLocaleString("id-ID")}
TP3 : Rp ${tp3.toLocaleString("id-ID")}

Volume :
${volume.toLocaleString("id-ID")}
`;

document.querySelector(".analysis-card").innerHTML = `
<h2>${kode}</h2>

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
`;
}catch(err){

console.error(err);

alert("API gagal dihubungi.");

}

}
