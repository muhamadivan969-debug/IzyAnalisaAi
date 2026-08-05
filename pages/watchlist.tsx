import StockRow from '@/components/StockRow';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { FixedSizeList as List } from 'react-window';

export default function Watchlist() {
  const [list, setList] = useState<string[]>(['BBCA','BBRI','TLKM','ASII','UNVR','BMRI','SMGR','ANTM','ADRO','INDF','PGAS','MEDC']);

  const Row = ({ index, style }: any) => {
    const code = list[index];
    return (
      <div style={style} className="p-2">
        <div className="bg-[#0a0e1a] rounded-xl border border-[#162035] p-4 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-white text-base">{code}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setList(l => l.filter(x => x !== code))} className="text-[#00c2ff]">Hapus</button>
            <button onClick={() => window.location.href = `/stock/${code}`} className="text-gray-300">Buka</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Watchlist Favorit Saya</h2>
      {list.length===0 ? <Card><p className="text-center text-gray-400 py-8">Belum ada saham yang ditambahkan ke watchlist Anda.</p></Card> : (
        <div className="h-[60vh]">
          <List height={520} itemCount={list.length} itemSize={72} width={'100%'}>
            {Row}
          </List>
        </div>
      )}
    </div>
  );
}
