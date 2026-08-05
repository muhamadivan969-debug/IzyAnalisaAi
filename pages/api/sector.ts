import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const name = String(req.query.name || "").toLowerCase();

  if (!process.env.PARSEBOT_API_KEY) {
    const samples: Record<string, any[]> = {
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

  return res.status(501).json({ error: "Real PARSEBOT fetch not implemented in stub." });
}
