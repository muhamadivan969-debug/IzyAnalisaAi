"use client";

import { useEffect, useState } from "react";
import Skeleton from "./Skeleton";

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

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-md mx-auto bg-[#0a0e1a] border-t border-[#162035] rounded-t-[22px] p-4 max-h-[70vh] overflow-y-auto animate-slide-up">
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
          <div className="space-y-3">
            {stocks.map((s: any) => (
              <div key={s.kode || s.symbol || s.symbols} className="p-3 bg-[#111a2e] rounded-lg flex justify-between">
                <div>
                  <div className="font-bold">{(s.kode || s.symbol || s.symbols || '').toUpperCase()}</div>
                  <div className="text-xs text-gray-400">{s.name || s.company || ''}</div>
                </div>
                <div className={`text-sm font-semibold ${ (s.changePercent||s.change_percent||0) >=0 ? 'text-[#00d26a]' : 'text-[#ff4d5a]' }`}>
                  {((s.changePercent||s.change_percent||0) >=0 ? '+' : '')}{Number(s.changePercent||s.change_percent||0).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => alert('Analisa Sektor dengan AI (coming soon)')} className="w-full bg-[#00c2ff] text-[#05070d] font-bold text-sm py-3 rounded-xl mt-6">Analisa Sektor dengan AI</button>
      </div>
    </div>
  );
}
