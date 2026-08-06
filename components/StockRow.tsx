"use client";

import { Star } from "lucide-react";
import Sparkline from "./Sparkline";
import { useEffect, useState } from "react";

type Stock = { kode: string; name: string; close: number; changePercent: number; spark?: number[] };

export default function StockRow({ stock, onClick, onToggle }: { stock: Stock; onClick?: () => void; onToggle?: () => void }) {
  const [inWatch, setInWatch] = useState(false);

  useEffect(() => {
    try {
      const key = 'watchlist';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      setInWatch(cur.includes(stock.kode));
    } catch (e) { }
  }, [stock.kode]);

  function toggle(e: any) {
    e.stopPropagation();
    try {
      const key = 'watchlist';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      const exists = cur.includes(stock.kode);
      const next = exists ? cur.filter((c: any) => c !== stock.kode) : [stock.kode, ...cur];
      localStorage.setItem(key, JSON.stringify(next));
      setInWatch(!exists);
      onToggle?.();
    } catch (err) { console.error(err); }
  }

  return (
    <div onClick={onClick} className="bg-[#0a0e1a] rounded-xl border border-[#162035] p-3 flex items-center justify-between cursor-pointer hover:shadow-sm">
      <div className="flex items-center space-x-3">
        <div>
          <h4 className="font-bold text-white text-sm">{stock.kode}</h4>
          <p className="text-xs text-gray-400 truncate max-w-[160px]">{stock.name}</p>
        </div>
        <div className="hidden sm:block">
          <Sparkline data={stock.spark || []} />
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="font-mono font-bold text-sm">{stock.close.toLocaleString()}</span>
        <span className={`text-xs font-semibold mt-1 ${stock.changePercent >= 0 ? 'text-[#00d26a]' : 'text-[#ff4d5a]'}`}>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
        <button onClick={toggle} className="mt-2 text-[#00c2ff]"><Star className={`w-4 h-4 ${inWatch ? 'text-yellow-400' : ''}`} /></button>
      </div>
    </div>
  );
}
