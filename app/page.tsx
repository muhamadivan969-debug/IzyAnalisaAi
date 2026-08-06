'use client';

import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import StockRow from "@/components/StockRow";
import ChartPlaceholder from "@/components/ChartPlaceholder";
import SectorBottomSheet from "@/components/SectorBottomSheet";
import { FixedSizeList as List } from 'react-window';

export default function Home() {
  const router = useRouter();
  const [ihsg, setIhsg] = useState<any>({ loading: true, close: 0, changePercent: 0 });
  const [topPicks, setTopPicks] = useState<any[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => {
    // Ambil data IHSG dari Yahoo Finance via API kita
    fetch('/api/saham?kode=^JKSE')
      .then(r => r.json())
      .then(j => {
        if (j?.success && j?.data) {
          setIhsg({ 
            loading: false, 
            close: j.data.close, 
            changePercent: j.data.changePercent 
          });
        } else {
          setIhsg(p => ({ ...p, loading: false }));
        }
      })
      .catch(() => setIhsg(p => ({ ...p, loading: false })));

    // Ambil daftar saham untuk top picks (ambil saham dengan volume tertinggi)
    fetch('/api/saham?top=5')
      .then(r => r.json())
      .then(j => {
        if (j?.success && j?.data) {
          setTopPicks(j.data);
          setTopLoading(false);
        } else {
          setTopLoading(false);
        }
      })
      .catch(() => setTopLoading(false));
  }, []);

  return (
    <div>
      <Head>
        <title>IzyAnalisaAI</title>
      </Head>

      <div className="space-y-6">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Selamat Datang</p>
          <h2 className="text-2xl font-bold">Halo, Trader!</h2>
        </div>

        <Card>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400 font-medium">IHSG</p>
              {ihsg.loading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {Number(ihsg.close).toLocaleString() || 0}
                  </span>
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                    ihsg.changePercent >= 0 ? "bg-[#00d26a]/15 text-[#00d26a]" : "bg-[#ff4d5a]/15 text-[#ff4d5a]"
                  }`}>
                    {ihsg.changePercent >= 0 ? `+${ihsg.changePercent.toFixed(2)}%` : `${ihsg.changePercent.toFixed(2)}%`}
                  </span>
                </div>
              )}
            </div>
            <div className="w-36">
              <div className="flex justify-end">
                <div className="text-xs bg-[#111a2e] px-2.5 py-1 rounded-full text-gray-300 font-mono">1D</div>
              </div>
              <ChartPlaceholder />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs text-gray-400">Fear & Greed Index</p>
            <h3 className="text-2xl font-extrabold text-[#00c2ff] mt-1">68</h3>
            <span className="text-xs text-gray-400">Greedy</span>
          </Card>

          <Card>
            <p className="text-xs text-gray-400">AI Win Rate</p>
            <h3 className="text-2xl font-extrabold text-[#00d26a] mt-1">84%</h3>
            <span className="text-xs text-gray-400">High Confidence</span>
          </Card>
        </div>

        <div>
          <h3 className="text-lg font-bold tracking-tight">🔥 Top Pick AI</h3>
          <div className="space-y-3 mt-3">
            {topLoading ? (
              Array.from({length:3}).map((_,i)=>(<Skeleton key={i} className="h-16 w-full" />))
            ) : topPicks.length === 0 ? (
              <Card>
                <p className="text-center text-gray-400 py-4">Belum ada data saham</p>
              </Card>
            ) : (
              topPicks.map((s:any) => (
                <StockRow 
                  key={s.kode || s.symbol} 
                  stock={{ 
                    kode: s.kode || s.symbol, 
                    name: s.name || '', 
                    close: s.close || 0, 
                    changePercent: s.changePercent || 0, 
                    spark: s.spark 
                  }} 
                  onClick={() => router.push(`/stock/${s.kode || s.symbol}`)} 
                  onToggle={() => alert('toggle watchlist')} 
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold tracking-tight">🌡️ Heatmap Sektor</h3>
          <p className="text-xs text-gray-400 -mt-2">Ketuk sektor untuk menampilkan list 950+ saham BEI secara dinamis.</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {['Perbankan', 'Energi', 'Tambang', 'Teknologi', 'Healthcare', 'Property', 'Consumer', 'Transportasi'].map(sec => (
              <div key={sec} onClick={() => setSelectedSector(sec)} className="bg-[#0a0e1a] p-4 rounded-xl border border-[#162035] text-center cursor-pointer hover:border-[#00c2ff]/50">
                <h4 className="font-bold text-sm">{sec}</h4>
                <span className="text-xs text-[#00d26a] font-semibold bg-[#00d26a]/10 px-2 py-0.5 rounded-full inline-block mt-1">+1.42%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSector && <SectorBottomSheet name={selectedSector} onClose={() => setSelectedSector(null)} />}
    </div>
  );
}
