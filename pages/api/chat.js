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

    if (!apiKey) {
      console.error("GEMINI_API_KEY tidak ditemukan di environment variables");
      return res.status(500).json({
        error: "Server error",
        reply: "Maaf, layanan AI belum dikonfigurasi dengan benar. Silakan hubungi admin."
      });
    }

    let dataSection = "";
    if (context) {
      dataSection = "\n=== DATA REAL-TIME (SUMBER RESMI, WAJIB DIGUNAKAN) ===\n";
      dataSection += "Waktu: " + context.waktu + "\n";
      dataSection += "IHSG: " + context.ihsg + " (" + context.ihsgPersen + ")\n";
      dataSection += "======================================\n";
    }

    const systemInstruction = `Kamu adalah AI analis saham untuk platform IzyAnalisaAI, fokus pada Bursa Efek Indonesia (BEI).

ATURAN PENTING:
1. WAJIB gunakan data real-time yang diberikan sebagai dasar analisis. JANGAN mengarang angka lain.
2. Jika data menunjukkan "N/A" atau "tidak tersedia", katakan dengan singkat bahwa data sedang tidak tersedia.
3. Jangan pernah mengklaim bisa memprediksi pasar dengan kepastian.
4. Gunakan istilah "Confidence Score" untuk keyakinan model, bukan jaminan hasil.
5. Jawab dengan bahasa Indonesia yang natural, santai tapi profesional, dan RINGKAS.
6. Gunakan format markdown (bold, bullet list) agar mudah dibaca.
7. Selalu akhiri dengan: "DYOR (Do Your Research) - ini bukan saran finansial."`;

    const userInput = dataSection ? dataSection + "\n\nPertanyaan user: " + message : message;

    const MODEL_PRIMARY = "gemini-flash-latest";
    const MODEL_FALLBACK = "gemini-2.5-flash";
    const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

    async function callInteractionsAPI(model) {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model,
          input: userInput,
          system_instruction: systemInstruction
        })
      });
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    }

    let result = await callInteractionsAPI(MODEL_PRIMARY);

    if (!result.ok) {
      console.error("Interactions API (model utama) gagal:", result.status, JSON.stringify(result.data));
      result = await callInteractionsAPI(MODEL_FALLBACK);
    }

    if (!result.ok) {
      console.error("Interactions API (fallback) juga gagal:", result.status, JSON.stringify(result.data));
      return res.status(200).json({
        reply: "Maaf, AI sedang mengalami gangguan koneksi ke server. Coba tanya lagi beberapa saat lagi ya."
      });
    }

    const interaction = result.data;
    let aiReply = interaction.output_text || "";
    if (!aiReply && Array.isArray(interaction.steps)) {
      for (const step of interaction.steps) {
        if (step.type === "model_output" && Array.isArray(step.content)) {
          for (const block of step.content) {
            if (block.type === "text" && block.text) aiReply += block.text;
          }
        }
      }
    }
    if (!aiReply) aiReply = "Maaf, AI tidak bisa memberikan jawaban untuk pertanyaan ini.";

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error("Chat handler error:", err);
    return res.status(500).json({
      error: "Server error",
      reply: "Maaf, terjadi kendala teknis saat menghubungi AI. Silakan coba lagi."
    });
  }
}
