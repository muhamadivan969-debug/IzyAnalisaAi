"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";

export default function StockDetail({ params }: any) {
  const kode = params?.kode?.toUpperCase?.() || '';
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetch(`/api/saham?kode=${encodeURIComponent(kode)}`).then(r=>r.json()).then(j=>{ setStock(j?.data || null); setLoading(false); }).catch(()=>setLoading(false));
  },[kode]);

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
            <button className="text-[#00c2ff]">★</button>
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
                  <h4 className="text-2xl font-bold text-[#00d26a]">82 / 100</h4>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rekomendasi</p>
                  <h4 className="text-2xl font-bold text-[#00c2ff]">BULLISH</h4>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={() => alert('Tanya AI (coming soon)')} className="bg-[#00c2ff] text-[#05070d] py-2 px-3 rounded-xl font-bold">Tanya AI</button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
