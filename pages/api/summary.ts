import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.PARSEBOT_API_KEY) {
    // Mock top picks (frontend mengharapkan array dengan { kode, name, close, changePercent })
    const mock = [
      { kode: "BBCA", name: "Bank Central Asia", close: 37850, changePercent: 0.95 },
      { kode: "TLKM", name: "Telkom Indonesia", close: 3350, changePercent: -0.45 },
      { kode: "BBRI", name: "Bank Rakyat Indonesia", close: 4300, changePercent: 0.42 },
      { kode: "ASII", name: "Astra International", close: 6100, changePercent: 1.12 },
      { kode: "UNVR", name: "Unilever Indonesia", close: 3850, changePercent: -0.2 },
    ];
    return res.status(200).json({ data: mock });
  }

  return res.status(501).json({ error: "Real PARSEBOT fetch not implemented in stub." });
}
