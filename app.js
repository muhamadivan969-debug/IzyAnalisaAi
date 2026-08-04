document.addEventListener("DOMContentLoaded", () => {
  loadIHSG();
  initTradingView("BBCA");
  setupSearchAutocomplete();
  setupChatWidget();
});

async function loadIHSG() {
  const valEl = document.getElementById("ihsgVal");
  try {
    const res = await fetch(`/api/analyze?kode=COMPOSITE`);
    const data = await res.json();
    if (data && data.data && data.data.results && data.data.results.length > 0) {
      const ihsgData = data.data.results[0];
      valEl.innerText = `${ihsgData.close || ihsgData.price} (${ihsgData.change || '0'}%)`;
    } else {
      valEl.innerText = "Aktif";
    }
  } catch (err) {
    console.error("Gagal memuat IHSG:", err);
    valEl.innerText = "Aktif";
  }
}

function initTradingView(symbol) {
  document.getElementById("tradingview_chart").innerHTML = "";
  new TradingView.widget({
    autosize: true,
    symbol: `IDX:${symbol}`,
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    hide_legend: false,
    save_image: false,
    container_id: "tradingview_chart",
    disabled_features: ["header_symbol_search"],
    enabled_features: [],
    exchanges: ["IDX"]
  });
}

async function setupSearchAutocomplete() {
  const input = document.getElementById("searchInput");
  const box = document.getElementById("autocompleteBox");
  let idxStocks = [];

  try {
    const res = await fetch("/api/stocks");
    const json = await res.json();
    idxStocks = json.data?.results || [];
  } catch (err) {
    console.error("Gagal memuat daftar emiten IDX:", err);
  }

  input.addEventListener("input", () => {
    const query = input.value.toUpperCase().trim();
    box.innerHTML = "";
    if (!query) return;

    const matches = idxStocks
      .filter(s => s.symbol.includes(query) || (s.name && s.name.toUpperCase().includes(query)))
      .slice(0, 6);

    matches.forEach(s => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.innerHTML = `<strong>${s.symbol}</strong> - <small>${s.name}</small>`;
      
      item.onclick = () => {
        input.value = s.symbol;
        box.innerHTML = "";
        initTradingView(s.symbol);
      };
      
      box.appendChild(item);
    });
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      box.innerHTML = "";
    }
  });
}

function setupChatWidget() {
  const input = document.getElementById("chatInput");
  const btn = document.getElementById("chatSendBtn");
  const chatMessages = document.getElementById("chatMessages");

  async function sendMessage() {
    const query = input.value.trim();
    if (!query) return;

    appendMessage(query, "user-msg");
    input.value = "";

    input.disabled = true;
    btn.disabled = true;
    btn.innerText = "Menganalisa...";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();

      if (data.reply) {
        appendMessage(data.reply, "ai-msg");
      } else {
        appendMessage(data.error || "Terjadi kesalahan pada AI.", "ai-msg");
      }
    } catch (err) {
      appendMessage("Gagal terhubung ke Server AI.", "ai-msg");
    } finally {
      input.disabled = false;
      btn.disabled = false;
      btn.innerText = "Kirim";
      input.focus();
    }
  }

  btn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function appendMessage(text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${className}`;
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}
