export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Parameter 'message' wajib diisi" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    let dataSection = "";
    if (context) {
      dataSection = "\n=== DATA REAL-TIME (SUMBER RESMI, WAJIB DIGUNAKAN) ===\n";
      dataSection += "Waktu: " + context.waktu + "\n";
      dataSection += "IHSG: " + context.ihsg + " (" + context.ihsgPersen + ")\n";
      if (context.saham) {
        const s = context.saham;
        dataSection += "\nSaham " + s.kode + ":\n";
        dataSection += "- Harga terakhir (close): Rp " + s.close + "\n";
        dataSection += "- Open: Rp " + s.open + " | High: Rp " + s.high + " | Low: Rp " + s.low + "\n";
        dataSection += "- Volume: " + s.volume + "\n";
        dataSection += "- Perubahan hari ini: " + s.perubahan + "\n";
      }
      dataSection += "======================================\n";
    }

    const systemPrompt = `Kamu adalah AI analis saham untuk platform IzyAnalisaAI, fokus pada Bursa Efek Indonesia (BEI).

ATURAN PENTING:
1. WAJIB gunakan data real-time di bawah sebagai dasar analisis. JANGAN mengarang angka lain.
2. Jika data menunjukkan "N/A" atau "tidak tersedia", katakan dengan singkat bahwa data sedang tidak tersedia - jangan menjelaskan panjang lebar data apa saja yang kamu butuhkan.
3. Jangan pernah mengklaim bisa memprediksi pasar dengan kepastian (misal 80-85%).
4. Gunakan istilah "Confidence Score" untuk keyakinan model, bukan jaminan hasil.
5. Jawab dengan bahasa Indonesia yang natural, santai tapi profesional, dan RINGKAS (maksimal 200 kata kecuali diminta detail).
6. Gunakan format markdown (bold, bullet list) agar mudah dibaca.
7. Selalu akhiri dengan: "DYOR (Do Your Own Research) - ini bukan saran finansial."
${dataSection}`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: systemPrompt + "\n\nPertanyaan user: " + message }] }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Gagal menghubungi Gemini API", detail: data });
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak bisa memberikan jawaban saat ini.";

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
