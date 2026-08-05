"use client";

import { FixedSizeList as List } from 'react-window';
import { useEffect, useState } from "react";
import Skeleton from './Skeleton';

export default function SectorBottomSheet({ name, onClose }: { name: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/sector?name=${encodeURIComponent(name)}`).then(r => r.json()).then(json => {
      if (!mounted) return;
      setStocks(json?.data || []);
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [name]);

  const Row = ({ index, style }: any) => {
    const s = stocks[index];
    const code = (s.kode || s.symbol || s.symbols || '').toUpperCase();
    const pct = Number(s.changePercent || s.change_percent || 0);
    return (
      <div style={style} className="p-3 bg-[#111a2e] border-b border-[#162035] flex justify-between items-center">
        <div>
          <div className="font-bold">{code}</div>
          <div className="text-xs text-gray-400">{s.name || s.company || ''}</div>
        </div>
        <div className={`text-sm font-semibold ${pct >= 0 ? 'text-[#00d26a]' : 'text-[#ff4d5a]'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-md mx-auto bg-[#0a0e1a] border-t border-[#162035] rounded-t-[22px] p-4 max-h-[70vh] overflow-hidden animate-slide-up">
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Sektor: {name}</h3>
          <button onClick={onClose} className="text-gray-400 text-lg">×</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="h-[56vh]">
            <List height={560} itemCount={stocks.length} itemSize={68} width={'100%'}>
              {Row}
            </List>
          </div>
        )}

        <button onClick={() => alert('Analisa Sektor dengan AI (coming soon)')} className="w-full bg-[#00c2ff] text-[#05070d] font-bold text-sm py-3 rounded-xl mt-6">Analisa Sektor dengan AI</button>
      </div>
    </div>
  );
}
