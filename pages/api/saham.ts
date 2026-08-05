import type { NextApiRequest, NextApiResponse } from "next";
import { fetchStockByCode } from "../../lib/parsebot";

type ResponseBody = { data?: any; error?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  const kode = String(req.query.kode || "").toUpperCase();

  // If no parse key, keep previous mock behavior
  const hasKey = Boolean(process.env.PARSE_API_KEY || process.env.PARSEBOT_API_KEY);
  if (!hasKey) {
    if (kode === "COMPOSITE") {
      return res.status(200).json({ data: { close: 7350.12, changePercent: 0.74 } });
    }
    return res.status(200).json({ data: { kode: kode || "BBCA", name: "Mock Saham", close: 14250, changePercent: 1.23 } });
  }

  try {
    const stock = await fetchStockByCode(kode || "BBCA");
    if (!stock) return res.status(404).json({ error: "Stock not found" });
    return res.status(200).json({ data: stock });
  } catch (err: any) {
    console.error("ParseBot stock error", err.message || err);
    return res.status(502).json({ error: "Failed to fetch from Parse.bot" });
  }
}
