import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const message = body.message || "Hai";
  // Jika tidak ada GEMINI_API_KEY, kembalikan jawaban mock
  if (!process.env.GEMINI_API_KEY) {
    const reply = `Ini jawaban AI contoh untuk: "${message}". (Gunakan GEMINI_API_KEY untuk jawaban nyata.)`;
    return res.status(200).json({ reply });
  }

  // Jika GEMINI_API_KEY ada, implementasikan pemanggilan ke layanan AI di sini.
  return res.status(501).json({ error: "Real AI proxy not implemented in stub." });
}
