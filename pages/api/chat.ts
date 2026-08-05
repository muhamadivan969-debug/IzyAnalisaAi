import type { NextApiRequest, NextApiResponse } from "next";
import { askOpenAI } from "../../lib/ai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, context } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message is required" });

  // If no OPENAI_API_KEY is provided, return a safe mock reply so frontend still works
  if (!process.env.OPENAI_API_KEY) {
    const reply = `Ini jawaban AI contoh untuk: "${message}". (Tambahkan OPENAI_API_KEY di .env.local untuk jawaban nyata.)`;
    return res.status(200).json({ reply });
  }

  try {
    const reply = await askOpenAI(message, context);
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error("AI error", err);
    return res.status(500).json({ error: "AI service error", detail: String(err.message || err) });
  }
}
