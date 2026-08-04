export default async function handler(req, res) {
  const { kode } = req.query;
  const apiKey = process.env.GOAPI_KEY;

  if (!kode) {
    return res.status(400).json({ error: "Kode saham wajib diisi" });
  }

  try {
    const response = await fetch(
      `https://api.goapi.id/v1/stock/idx/prices?symbol=${kode}&api_key=${apiKey}`
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Gagal mengambil data indikator" });
  }
}
