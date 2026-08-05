import type { NextApiRequest, NextApiResponse } from "next";

type ResponseBody = { data?: any; error?: string };

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  const kode = String(req.query.kode || "").toUpperCase();

  // Jika tidak ada API key, kembalikan mock agar UI bisa tampil
  if (!process.env.PARSEBOT_API_KEY) {
    if (kode === "COMPOSITE") {
      return res.status(200).json({ data: { close: 7350.12, changePercent: 0.74 } });
    }
    return res.status(200).json({
      data: { kode: kode || "BBCA", name: "Mock Saham", close: 14250, changePercent: 1.23 },
    });
  }

  // Jika ada PARSEBOT_API_KEY, Anda bisa implementasikan fetch nyata ke service scraping di sini.
  return res.status(501).json({ error: "Real PARSEBOT fetch not implemented in stub." });
}
