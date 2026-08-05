import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSector } from "../../lib/parsebot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const name = String(req.query.name || "").toLowerCase();
  const hasKey = Boolean(process.env.PARSE_API_KEY || process.env.PARSEBOT_API_KEY);

  if (!hasKey) {
    const samples = {
      perbankan: [
        { symbol: "BBCA", name: "Bank Central Asia", close: 37850, changePercent: 0.95 },
        { symbol: "BBRI", name: "Bank Rakyat Indonesia", close: 4300, changePercent: 0.42 },
      ],
      teknologi: [
        { symbol: "TLKM", name: "Telkom Indonesia", close: 3350, changePercent: -0.45 },
      ],
    };
    return res.status(200).json({ data: samples[name] || samples["perbankan"] });
  }

  try {
    const result = await fetchSector(name || "Perbankan");
    return res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ParseBot sector error", err.message || err);
    return res.status(502).json({ error: "Failed to fetch sector from Parse.bot" });
  }
}
