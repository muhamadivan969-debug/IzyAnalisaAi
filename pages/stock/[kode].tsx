"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import CandlestickChart from "@/components/CandlestickChart";
import { useToast } from "@/components/Toast";

export default function StockDetail({ params }: any) {
  const kode = params?.kode?.toUpperCase?.() || '';
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showATR, setShowATR] = useState(true);
  const { toast } = useToast();

  useEffect(()=>{
    fetch(`/api/saham?kode=${encodeURIComponent(kode)}`).then(r=>r.json()).then(j=>{ setStock(j?.data || null); setLoading(false); }).catch(()=>setLoading(false));
  },[kode]);

  useEffect(() => {
    // track visit for analytics or similar (no-op)
  }, [kode]);

  function toggleWatch() {
    try {
      const key = 'watchlist';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      const exists = cur.includes(kode);
      const next = exists ? cur.filter((c: any) => c !== kode) : [kode, ...cur];
      localStorage.setItem(key, JSON.stringify(next));
      toast(`${kode} ${exists ? 'dihapus dari' : 'ditambahkan ke'} Watchlist`);
    } catch (e) {
      console.error(e);
    }
  }

  if (!kode) return <div>Invalid</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => history.back()} className="text-gray-400">← Kembali</button>
      {loading ? <Skeleton className="h-8 w-40" /> : (
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-extrabold">{stock.kode}</h2>
              <p className="text-sm text-gray-400">{stock.name}</p>
            </div>
            <button onClick={toggleWatch} className="text-[#00c2ff]">★</button>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold">{Number(stock.close).toLocaleString()}</div>
                <div className={`${stock.changePercent>=0 ? 'text-[#00d26a]' : 'text-[#ff4d5a]'} font-semibold`}>{stock.changePercent>=0?'+':''}{Number(stock.changePercent).toFixed(2)}%</div>
              </div>
              <div className="w-48">
                <div className="h-36 bg-[#071028] rounded-lg" />
              </div>
            </div>
          </Card>

          <div className="space-y-3 mt-3">
            <h3 className="font-bold">Analisa AI</h3>
            <Card>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Skor Keyakinan</p>
                  <h4 className="text-2xl font-bold text-[#00d26a]">{stock.aiScore ?? 82} / 100</h4>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rekomendasi</p>
                  <h4 className="text-2xl font-bold text-[#00c2ff]">{stock.recommendation || 'BULLISH'}</h4>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => toast('Tanya AI masih dalam pengembangan')} className="bg-[#00c2ff] text-[#05070d] py-2 px-3 rounded-xl font-bold">Tanya AI</button>
                <button onClick={() => { setShowSMA(s => !s); }} className={`px-3 py-1 rounded-full ${showSMA ? 'bg-[#00c2ff] text-[#05070d]' : 'bg-[#111827] text-gray-300'}`}>SMA</button>
                <button onClick={() => { setShowRSI(s => !s); }} className={`px-3 py-1 rounded-full ${showRSI ? 'bg-[#00c2ff] text-[#05070d]' : 'bg-[#111827] text-gray-300'}`}>RSI</button>
                <button onClick={() => { setShowATR(s => !s); }} className={`px-3 py-1 rounded-full ${showATR ? 'bg-[#00c2ff] text-[#05070d]' : 'bg-[#111827] text-gray-300'}`}>ATR</button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Chart</h4>
                <CandlestickChart data={stock.chartData || []} showSMA={showSMA} showRSI={showRSI} showATR={showATR} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
