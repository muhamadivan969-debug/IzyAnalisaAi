"use client";

import Card from '@/components/Card';
import { useState } from 'react';
import { useRouter } from 'next/router';
import StockRow from '@/components/StockRow';
import Skeleton from '@/components/Skeleton';

export default function Analisa() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL'|'BULLISH'|'BEARISH'>('ALL');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  function doSearch() {
    if (!query) return;
    setLoading(true);
    // For now fake search: go to stock detail
    router.push(`/stock/${query}`);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Cari & Scan Saham</h2>
      <div className="relative">
        <input value={query} onChange={(e)=>setQuery(e.target.value.toUpperCase())} className="w-full bg-[#111a2e] rounded-xl border border-[#162035] p-3" placeholder="Masukkan kode saham... (e.g. BBCA)" />
        <button onClick={doSearch} className="absolute right-2 top-2 bg-[#00c2ff] text-[#05070d] text-xs font-bold px-3 py-1.5 rounded-lg">CARI</button>
      </div>

      <div className="flex space-x-2">
        {(['ALL','BULLISH','BEARISH'] as const).map(c=> (
          <button key={c} onClick={()=>setFilter(c)} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${filter===c? 'bg-[#00c2ff] text-[#05070d]':'text-gray-300'}`}>{c}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? <Skeleton className="h-16" /> : (results.length===0 ? <Card><p className="text-center text-gray-400 py-8">Tidak ada hasil. Coba cari kode saham.</p></Card> : results.map(r=>(<StockRow key={r.kode} stock={r} />)))}
      </div>
    </div>
  );
}
