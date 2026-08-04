import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  const { kode } = req.query;

  if (!kode) {
    return res.status(400).json({ error: 'Parameter kode wajib diisi' });
  }

  const possiblePaths = [
    path.join(process.cwd(), 'data', 'Saham', 'Semua', `${kode}.csv`),
    path.join(process.cwd(), 'public', 'data', 'Saham', 'Semua', `${kode}.csv`)
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    return res.status(404).json({ 
      error: `Saham ${kode} tidak ditemukan di database lokal. Pastikan file ${kode}.csv ada di folder data/Saham/Semua/.` 
    });
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    if (records.length === 0) {
      return res.status(404).json({ error: 'Data saham kosong' });
    }

    const latest = records[records.length - 1];
    const prev = records.length > 1 ? records[records.length - 2] : latest;

    const changePercent = ((Number(latest.close) - Number(prev.close)) / Number(prev.close)) * 100;

    const result = {
      kode: kode,
      close: Number(latest.close),
      open: Number(latest.open_price || latest.close),
      high: Number(latest.high),
      low: Number(latest.low),
      volume: Number(latest.volume),
      changePercent: changePercent,
      date: latest.date,
      previous: Number(latest.previous),
      history: records
    };

    return res.status(200).json({ data: result });

  } catch (error) {
    console.error('Error reading CSV:', error);
    return res.status(500).json({ error: 'Server error saat membaca file data' });
  }
}
