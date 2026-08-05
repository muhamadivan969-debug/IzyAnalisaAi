import type { NextApiRequest, NextApiResponse } from "next";
import { fetchTopPicks } from "../../lib/parsebot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const hasKey = Boolean(process.env.PARSE_API_KEY || process.env.PARSEBOT_API_KEY);
  if (!hasKey) {
    const mock = [
      { kode: "BBCA", name: "Bank Central Asia", close: 37850, changePercent: 0.95 },
      { kode: "TLKM", name: "Telkom Indonesia", close: 3350, changePercent: -0.45 },
      { kode: "BBRI", name: "Bank Rakyat Indonesia", close: 4300, changePercent: 0.42 },
      { kode: "ASII", name: "Astra International", close: 6100, changePercent: 1.12 },
      { kode: "UNVR", name: "Unilever Indonesia", close: 3850, changePercent: -0.2 },
    ];
    return res.status(200).json({ data: mock });
  }

  try {
    const top = await fetchTopPicks();
    return res.status(200).json({ data: top });
  } catch (err: any) {
    console.error("ParseBot summary error", err.message || err);
    return res.status(502).json({ error: "Failed to fetch top picks from Parse.bot" });
  }
}
