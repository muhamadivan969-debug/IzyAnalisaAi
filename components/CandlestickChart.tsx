"use client";

import ReactECharts from 'echarts-for-react';

function sma(values: number[], period = 20) {
  const res: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      res.push(null);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    res.push(sum / period);
  }
  return res;
}

function rsi(values: number[], period = 14) {
  const res: (number | null)[] = [];
  let gains = 0;
  let losses = 0;
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      res.push(null);
      continue;
    }
    const change = values[i] - values[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    if (i <= period) {
      gains += gain;
      losses += loss;
      if (i < period) {
        res.push(null);
        continue;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      res.push(100 - 100 / (1 + rs));
    } else {
      // Wilder smoothing
      const prevAvgGain = res[i - 1] == null ? gains / period : 0; // not used
      // compute smoothed averages differently: we keep running sums
      // simpler approach: compute average over last period (less efficient)
      const slice = values.slice(i - period + 1, i + 1);
      let g = 0,
        l = 0;
      for (let v = 1; v < slice.length; v++) {
        const ch = slice[v] - slice[v - 1];
        if (ch > 0) g += ch;
        else l += -ch;
      }
      const avgG = g / period;
      const avgL = l / period;
      const rs = avgL === 0 ? 100 : avgG / avgL;
      res.push(100 - 100 / (1 + rs));
    }
  }
  return res;
}

function atr(data: Array<{ high: number; low: number; close: number }>, period = 14) {
  const trs: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      trs.push(data[i].high - data[i].low);
      continue;
    }
    const cur = data[i];
    const prev = data[i - 1];
    const tr = Math.max(cur.high - cur.low, Math.abs(cur.high - prev.close), Math.abs(cur.low - prev.close));
    trs.push(tr);
  }
  const res: (number | null)[] = [];
  for (let i = 0; i < trs.length; i++) {
    if (i < period) {
      res.push(null);
      continue;
    }
    const slice = trs.slice(i - period + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    res.push(sum / period);
  }
  return res;
}

export default function CandlestickChart({ data = [] }: { data?: Array<{ time: string; open: number; high: number; low: number; close: number }> }) {
  const times = data.map((d) => d.time);
  const ohlc = data.map((d) => [d.open, d.close, d.low, d.high]);
  const closes = data.map((d) => d.close);

  const sma20 = sma(closes, 20).map((v) => (v == null ? '-' : Number(v.toFixed(2))));
  const rsi14 = rsi(closes, 14).map((v) => (v == null ? '-' : Number(v.toFixed(2))));
  const atr14 = atr(data, 14).map((v) => (v == null ? '-' : Number((v || 0).toFixed(2))));

  const option: any = {
    backgroundColor: 'transparent',
    textStyle: { color: '#e5e9f5' },
    grid: [
      { left: 8, right: 12, top: 12, height: '52%' },
      { left: 8, right: 12, top: '58%', height: '18%' },
      { left: 8, right: 12, top: '78%', height: '16%' },
    ],
    xAxis: [
      { type: 'category', data: times, gridIndex: 0, boundaryGap: false, axisLine: { lineStyle: { color: '#223244' } }, axisLabel: { color: '#9fb0c8' } },
      { type: 'category', data: times, gridIndex: 1, boundaryGap: false, axisLine: { lineStyle: { color: '#223244' } }, axisLabel: { show: false } },
      { type: 'category', data: times, gridIndex: 2, boundaryGap: false, axisLine: { lineStyle: { color: '#223244' } }, axisLabel: { show: false } }
    ],
    yAxis: [
      { scale: true, gridIndex: 0, splitLine: { show: false }, axisLine: { lineStyle: { color: '#223244' } } },
      { scale: true, gridIndex: 1, splitLine: { show: false }, axisLine: { show: false } },
      { scale: true, gridIndex: 2, splitLine: { show: false }, axisLine: { show: false } }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: '#071028',
      borderColor: '#223244',
      textStyle: { color: '#e5e9f5' }
    },
    axisPointer: {
      link: [{ xAxisIndex: [0, 1, 2] }],
      label: { backgroundColor: '#283645' }
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2], start: 50, end: 100 },
      { show: true, xAxisIndex: [0, 1, 2], type: 'slider', top: '95%', start: 50, end: 100, fillerColor: 'rgba(0,194,255,0.12)', handleIcon: 'M8.2,13.8L8.2,13.8C8.6,13.9,9,14,9.4,14h0c0.4,0,0.8-0.1,1.2-0.2' }
    ],
    series: [
      {
        name: 'Candlestick',
        type: 'candlestick',
        data: ohlc,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: { color: '#00d26a', color0: '#ff4d5a', borderColor: '#00d26a', borderColor0: '#ff4d5a' }
      },
      {
        name: 'SMA 20',
        type: 'line',
        data: sma20,
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#00c2ff', width: 1.5 }
      },
      {
        name: 'RSI 14',
        type: 'line',
        data: rsi14,
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { color: '#ffd166', width: 1.2 }
      },
      {
        name: 'ATR 14',
        type: 'line',
        data: atr14,
        xAxisIndex: 2,
        yAxisIndex: 2,
        showSymbol: false,
        lineStyle: { color: '#9ad66e', width: 1.2 }
      }
    ]
  };

  return (
    <div className="w-full -mx-4">
      <ReactECharts option={option} style={{ height: 420 }} />
    </div>
  );
}
