import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong" });
  }

  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean);

  for (const apiKey of apiKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
      });

      return res.status(200).json({ reply: response.text });
    } catch (error) {
      console.warn("Key Gemini bermasalah/limit, mencoba key cadangan...");
    }
  }

  return res.status(500).json({ error: "Semua Gemini API Key mencapai limit harian." });
}
