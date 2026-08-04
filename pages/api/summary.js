import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'summary.csv'),
    path.join(process.cwd(), 'public', 'data', 'summary.csv')
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    return res.status(404).json({ error: 'Summary data belum tersedia. Jalankan generate-summary.py terlebih dahulu.' });
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    return res.status(200).json({ data: records });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal membaca summary data' });
  }
}
