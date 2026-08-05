"use client";

import ReactECharts from 'echarts-for-react';

export default function CandlestickChart({ data = [] }: { data?: Array<{time: string, open: number, high: number, low: number, close: number}> }) {
  // transform to [open, close, low, high] for ECharts candlestick
  const times = data.map(d => d.time);
  const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);

  const option = {
    animation: false,
    grid: { left: 8, right: 12, top: 12, bottom: 24 },
    xAxis: { type: 'category', data: times, scale: true, boundaryGap: false, axisLine: { lineStyle: { color: '#223244' } } },
    yAxis: { scale: true, splitLine: { show: false }, axisLine: { lineStyle: { color: '#223244' } } },
    tooltip: {
      trigger: 'item',
      axisPointer: { type: 'cross' },
      backgroundColor: '#071028',
      borderColor: '#223244',
      textStyle: { color: '#e5e9f5' }
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: [0], start: 50, end: 100 },
      { show: true, xAxisIndex: [0], type: 'slider', top: '90%', start: 50, end: 100, fillerColor: 'rgba(0,194,255,0.12)', handleIcon: 'M8.2,13.8L8.2,13.8C8.6,13.9,9,14,9.4,14h0c0.4,0,0.8-0.1,1.2-0.2' }
    ],
    series: [
      {
        type: 'candlestick',
        data: ohlc,
        itemStyle: {
          color: '#00d26a',
          color0: '#ff4d5a',
          borderColor: '#00d26a',
          borderColor0: '#ff4d5a'
        },
        tooltip: { formatter: (params: any) => {
          // params is array-like
          const p = params[0];
          if (!p) return '';
          const [o,c,l,h] = p.data;
          return `O: ${o}\nH: ${h}\nL: ${l}\nC: ${c}`;
        } }
      }
    ]
  };

  return (
    <div className="w-full -mx-4">
      <ReactECharts option={option} style={{ height: 280 }} />
    </div>
  );
}
