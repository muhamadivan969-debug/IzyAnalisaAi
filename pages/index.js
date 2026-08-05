import Head from "next/head";
import Script from "next/script";
import { useEffect, useRef } from "react";

// Konten body di-inject via dangerouslySetInnerHTML karena halaman ini
// masih berbasis HTML/CSS/JS custom (bukan komponen React terpisah).
// Ini pendekatan sah untuk migrasi bertahap ke Next.js tanpa menulis
// ulang ratusan baris markup jadi JSX sekaligus (yang berisiko tinggi
// menimbulkan bug baru). app.js tetap berjalan sebagai script biasa
// dan memanipulasi DOM ini persis seperti sebelumnya.
const BODY_HTML = "<div class=\"loading\" id=\"loading\">\n<div class=\"spinner\"></div>\n<p>Loading Market...</p>\n</div>\n\n<header>\n<div class=\"logo\">\n<h1><span class=\"blue\">Izy</span><span class=\"white\">Analisa</span><span class=\"blue\">AI</span></h1>\n<p>Smart Indonesian Stock Intelligence</p>\n</div>\n<div class=\"menu\">\n<button data-target=\"dashboardSection\">Dashboard</button>\n<button data-target=\"marketSection\">Scanner</button>\n<button data-target=\"searchSection\">Analisa</button>\n<button data-target=\"topPickSection\">Watchlist</button>\n<button data-target=\"premiumSection\">Premium</button>\n</div>\n</header>\n\n<section class=\"hero\" id=\"homeSection\">\n<div>\n<h2>Analisa Saham Indonesia dengan Artificial Intelligence</h2>\n<p>Temukan peluang trading berdasarkan AI Score, RSI, MACD, EMA, Volume, Support, Resistance, serta kondisi IHSG.</p>\n<button class=\"primary\" data-target=\"searchSection\" onclick=\"document.getElementById('stockInput').focus();document.getElementById('searchSection').scrollIntoView({behavior:'smooth'});\">Mulai Analisa</button>\n</div>\n<div id=\"tvchart\"></div>\n</section>\n\n<section class=\"dashboard\" id=\"dashboardSection\">\n<div class=\"box\"><p>IHSG</p><h2 id=\"ihsg\">Loading...</h2><span id=\"ihsgPersen\">0%</span></div>\n<div class=\"box\"><p>Fear & Greed</p><h2>68</h2><span>Greedy</span></div>\n<div class=\"box\"><p>AI Confidence</p><h2>84%</h2><span>Bullish</span></div>\n</section>\n\n<section class=\"section\" id=\"topPickSection\">\n<div class=\"section-header\"><h2>\ud83d\udd25 Top Pick AI Besok</h2><a href=\"#\">Lihat Semua</a></div>\n<div class=\"stock-grid\"><div class=\"stock-card\"><div><h3>Memuat...</h3><p>Mengambil data pasar</p></div></div></div>\n</section>\n\n<section class=\"section\" id=\"searchSection\">\n<h2>Cari Saham</h2>\n<div class=\"search-box\">\n<input type=\"text\" placeholder=\"Contoh : BBRI\" id=\"stockInput\">\n<button id=\"analyzeButton\">ANALISA AI</button>\n</div>\n</section>\n\n<section class=\"section\">\n<div class=\"analysis-card\" id=\"analysisCard\">\n<p style=\"text-align:center;padding:20px 0;opacity:.6;\">Cari kode saham di atas untuk melihat hasil analisa AI di sini.</p>\n</div>\n</section>\n\n<section class=\"section\" id=\"marketSection\">\n<div class=\"market-grid\">\n<div class=\"market-card\"><h2>\ud83d\udcc8 Top Gainers</h2><ul><li>Memuat data...</li></ul></div>\n<div class=\"market-card\"><h2>\ud83d\udcc9 Top Losers</h2><ul><li>Memuat data...</li></ul></div>\n</div>\n</section>\n\n<section class=\"section\">\n<h2>\ud83c\udf21\ufe0f Heatmap Sektor</h2>\n<p style=\"color:var(--text2);font-size:13px;margin-bottom:14px;margin-top:-8px;\">Ketuk sektor untuk melihat semua saham di dalamnya</p>\n<div class=\"heatmap\">\n<div class=\"heat green\">Perbankan</div>\n<div class=\"heat green\">Energi</div>\n<div class=\"heat green\">Tambang</div>\n<div class=\"heat red\">Teknologi</div>\n<div class=\"heat green\">Healthcare</div>\n<div class=\"heat red\">Property</div>\n<div class=\"heat green\">Consumer</div>\n<div class=\"heat green\">Transportasi</div>\n</div>\n</section>\n\n<section class=\"section\">\n<h2>\ud83d\udcf0 Market News</h2>\n<div class=\"news-card\"><h3>IHSG Ditutup Menguat</h3><p>Sentimen positif sektor perbankan mendorong IHSG menguat pada sesi perdagangan hari ini.</p></div>\n<div class=\"news-card\"><h3>AI Trading Plan</h3><p>AI mendeteksi peluang bullish pada sektor perbankan untuk perdagangan besok.</p></div>\n</section>\n\n<section class=\"premium-banner\" id=\"premiumSection\">\n<h2>\u2b50 Upgrade ke Premium</h2>\n<p>Unlock AI Scanner, Trading Plan, Support Resistance, Buy Area, Stop Loss, TP1, TP2, TP3, Bandarmology, dan AI Chat.</p>\n<button>Upgrade Premium</button>\n</section>\n\n<section class=\"section\" id=\"profilSection\">\n<h2>\ud83d\udc64 Profil</h2>\n<div class=\"profil-header\">\n<div class=\"profil-avatar\">\ud83d\udc64</div>\n<div><h3>Trader IzyAnalisaAI</h3><p>Akun Gratis</p></div>\n</div>\n<div class=\"profil-menu\">\n<div class=\"profil-menu-item\" data-target=\"premiumSection\"><span>\u2b50 Upgrade ke Premium</span><span class=\"arrow\">\u203a</span></div>\n<div class=\"profil-menu-item\" data-target=\"topPickSection\"><span>\ud83d\udccc Watchlist Saya</span><span class=\"arrow\">\u203a</span></div>\n<div class=\"profil-menu-item\" id=\"profilNotifikasi\"><span>\ud83d\udd14 Pengaturan Notifikasi</span><span class=\"arrow\">\u203a</span></div>\n<div class=\"profil-menu-item\" id=\"profilBantuan\"><span>\u2753 Bantuan & FAQ</span><span class=\"arrow\">\u203a</span></div>\n<div class=\"profil-menu-item\" id=\"profilTentang\"><span>\u2139\ufe0f Tentang IzyAnalisaAI</span><span class=\"arrow\">\u203a</span></div>\n</div>\n</section>\n\n<nav class=\"bottom-nav\">\n<a href=\"#\" class=\"active\" data-target=\"homeSection\">\ud83c\udfe0<span>Home</span></a>\n<a href=\"#\" data-target=\"dashboardSection\">\ud83d\udcc8<span>Chart</span></a>\n<a href=\"#\" data-target=\"searchSection\">\ud83e\udd16<span>AI</span></a>\n<a href=\"#\" data-target=\"marketSection\">\ud83d\udd14<span>Alert</span></a>\n<a href=\"#\" data-target=\"profilSection\">\ud83d\udc64<span>Profil</span></a>\n</nav>\n\n<footer><p>\u00a9 2026 IzyAnalisaAI</p><p>AI Stock Analysis Indonesia</p></footer>";

export default function Home() {
  const injected = useRef(false);

  useEffect(() => {
    // Cegah double-injection saat React re-render (mis. di dev mode / StrictMode)
    if (injected.current) return;
    injected.current = true;
  }, []);

  return (
    <>
      <Head>
        <title>IzyAnalisaAI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <Script src="https://s3.tradingview.com/tv.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" strategy="beforeInteractive" />

      <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />

      {/* app.js dimuat setelah konten ter-render, supaya semua
          document.getElementById() di dalamnya berhasil menemukan elemen */}
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
