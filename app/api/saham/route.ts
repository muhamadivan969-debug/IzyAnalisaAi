import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kode = searchParams.get('kode');

    // Panggil Yahoo Finance API
    const fetchStock = async (symbol: string) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data?.chart?.result?.[0]) {
        const meta = data.chart.result[0].meta;
        const quote = data.chart.result[0].indicators.quote[0];
        const lastIndex = quote.close.length - 1;
        
        return {
          kode: symbol.replace('.JK', ''),
          name: meta.symbol || symbol,
          close: quote.close[lastIndex] || 0,
          changePercent: ((quote.close[lastIndex] - quote.open[0]) / quote.open[0]) * 100 || 0,
          volume: quote.volume[lastIndex] || 0,
        };
      }
      return null;
    };

    if (kode) {
      // Tambahkan .JK untuk saham Indonesia
      const symbol = kode.toUpperCase().includes('.JK') ? kode.toUpperCase() : `${kode.toUpperCase()}.JK`;
      const stock = await fetchStock(symbol);
      
      if (stock) {
        return NextResponse.json({
          success: true,
          data: stock,
        });
      }
    }

    // Kalo gak ada kode, ambil IHSG
    const ihsg = await fetchStock('^JKSE');
    return NextResponse.json({
      success: true,
      data: ihsg,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal ambil data' },
      { status: 500 }
    );
  }
}
