"use client";

import ReactECharts from 'echarts-for-react';

export default function CandlestickChart({ data = [] }: { data?: Array<{time: string, open: number, high: number, low: number, close: number}> }) {
  // transform to [time, [open, close, low, high]] for ECharts candlestick
  const times = data.map(d => d.time);
  const ohlc = data.map(d => [d.open, d.close, d.low, d.high]);

  const option = {
    animation: false,
    grid: { left: 8, right: 8, top: 8, bottom: 24 },
    xAxis: { type: 'category', data: times, axisLabel: { show: false }, boundaryGap: false },
    yAxis: { scale: true, splitLine: { show: false } },
    series: [
      {
        type: 'candlestick',
        data: ohlc,
        itemStyle: {
          color: '#00d26a',
          color0: '#ff4d5a',
          borderColor: '#00d26a',
          borderColor0: '#ff4d5a'
        }
      }
    ]
  };

  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height: 240 }} />
    </div>
  );
}
