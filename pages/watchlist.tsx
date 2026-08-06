import StockRow from '@/components/StockRow';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { FixedSizeList as List } from 'react-window';
import { useRouter } from 'next/router';

export default function Watchlist() {
  const router = useRouter();
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    try {
      const cur = JSON.parse(localStorage.getItem('watchlist') || '[]');
      setList(cur);
    } catch (e) { setList([]); }
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'watchlist') {
        try { setList(JSON.parse(e.newValue || '[]')); } catch (err) { }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const Row = ({ index, style }: any) => {
    const code = list[index];
    return (
      <div style={style} className="p-2">
        <div className="bg-[#0a0e1a] rounded-xl border border-[#162035] p-4 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-white text-base">{code}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => {
              const next = list.filter(x => x !== code);
              localStorage.setItem('watchlist', JSON.stringify(next));
              setList(next);
            }} className="text-[#00c2ff]">Hapus</button>
            <button onClick={() => router.push(`/stock/${encodeURIComponent(code)}`)} className="text-gray-300">Buka</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Watchlist Favorit Saya</h2>
      {list.length === 0 ? (
        <Card><p className="text-center text-gray-400 py-8">Belum ada saham yang ditambahkan ke watchlist Anda.</p></Card>
      ) : (
        <div className="h-[60vh]">
          <List height={520} itemCount={list.length} itemSize={72} width={'100%'}>
            {Row}
          </List>
        </div>
      )}
    </div>
  );
}
