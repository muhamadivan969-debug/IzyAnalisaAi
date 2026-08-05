"use client";

import { Star } from "lucide-react";

type Stock = { kode: string; name: string; close: number; changePercent: number };

export default function StockRow({ stock, onClick, onToggle }: { stock: Stock; onClick?: () => void; onToggle?: () => void }) {
  return (
    <div onClick={onClick} className="bg-[#0a0e1a] rounded-xl border border-[#162035] p-3 flex items-center justify-between cursor-pointer hover:shadow-sm">
      <div>
        <h4 className="font-bold text-white text-sm">{stock.kode}</h4>
        <p className="text-xs text-gray-400 truncate max-w-[220px]">{stock.name}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="font-mono font-bold text-sm">{stock.close.toLocaleString()}</span>
        <span className={`text-xs font-semibold mt-1 ${stock.changePercent >= 0 ? 'text-[#00d26a]' : 'text-[#ff4d5a]'}`}>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
        <button onClick={(e) => { e.stopPropagation(); onToggle?.(); }} className="mt-2 text-[#00c2ff]"><Star className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
