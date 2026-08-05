"use client";

import { Sparklines, SparklinesLine } from 'react-sparklines';

export default function Sparkline({ data = [] }: { data?: number[] }) {
  const normalized = Array.isArray(data) ? data.slice(-20).map(d => Number(d) || 0) : [];
  return (
    <div className="w-20 h-6">
      <Sparklines data={normalized} limit={20} width={80} height={24}>
        <SparklinesLine color="#00c2ff" style={{ strokeWidth: 2, fill: "none" }} />
      </Sparklines>
    </div>
  );
}
