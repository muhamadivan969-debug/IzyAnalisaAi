export default async function handler(req, res) {
  const apiKey = process.env.GOAPI_KEY;

  try {
    const response = await fetch(
      `https://api.goapi.id/v1/stock/idx/companies?api_key=${apiKey}`
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Gagal mengambil daftar emiten IDX" });
  }
}
