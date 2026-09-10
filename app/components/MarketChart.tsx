"use client";
import {useEffect,useMemo,useState} from "react";
import {binanceSymbol,formatPrice} from "../../lib/market-data";

type Candle={time:number;open:number;high:number;low:number;close:number};

export default function MarketChart({pair}:{pair:string}){
  const [candles,setCandles]=useState<Candle[]>([]);
  const [error,setError]=useState("");
  const symbol=binanceSymbol(pair);

  useEffect(()=>{
    let alive=true;
    setError("");
    setCandles([]);
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=90`)
      .then(r=>{if(!r.ok)throw new Error("Market data unavailable");return r.json()})
      .then(rows=>{if(!alive)return;setCandles(rows.map((r:number[])=>({time:r[0],open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4])})))})
      .catch(()=>alive&&setError("Live chart feed unavailable"));
    const ws=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);
    ws.onmessage=e=>{try{const k=JSON.parse(e.data).k as {t:number;o:string;h:string;l:string;c:string};const next={time:k.t,open:Number(k.o),high:Number(k.h),low:Number(k.l),close:Number(k.c)};setCandles(prev=>{const copy=[...prev];const i=copy.findIndex(x=>x.time===next.time);if(i>=0)copy[i]=next;else copy.push(next);return copy.slice(-90)})}catch{}}
    ws.onerror=()=>alive&&setError("Live chart feed unavailable");
    return()=>{alive=false;ws.close()}
  },[symbol]);

  const view=useMemo(()=>{
    if(!candles.length)return null;
    const width=1000,height=360,padX=18,padY=18;
    const min=Math.min(...candles.map(c=>c.low)),max=Math.max(...candles.map(c=>c.high));
    const range=Math.max(max-min,Number.EPSILON);
    const x=(i:number)=>padX+(i/(Math.max(candles.length-1,1)))*(width-padX*2);
    const y=(v:number)=>height-padY-((v-min)/range)*(height-padY*2);
    return {width,height,min,max,x,y};
  },[candles]);

  return <div className="chart live-chart"><div className="chart-toolbar"><span>1m</span><span>15m</span><span>1h</span><span>4h</span><span>1D</span><strong>{candles.length?formatPrice(candles[candles.length-1].close):"—"}</strong></div>{view&&<svg viewBox={`0 0 ${view.width} ${view.height}`} preserveAspectRatio="none" role="img" aria-label={`${pair} live candlestick chart`}>{[0.25,0.5,0.75].map(v=><line key={v} x1="0" x2={view.width} y1={view.height*v} y2={view.height*v} className="chart-grid-line"/>)}{candles.map((c,i)=>{const up=c.close>=c.open;const cx=view.x(i);const bodyTop=view.y(Math.max(c.open,c.close));const bodyBottom=view.y(Math.min(c.open,c.close));const bodyHeight=Math.max(1,bodyBottom-bodyTop);return <g key={c.time} className={up?"candle-up":"candle-down"}><line x1={cx} x2={cx} y1={view.y(c.high)} y2={view.y(c.low)} /><rect x={cx-3.2} y={bodyTop} width="6.4" height={bodyHeight} rx="1" /></g>})}</svg>}{!candles.length&&<div className="chart-placeholder">{error||"Loading live market data…"}</div>}<div className="chart-footer"><span>Binance public market feed</span><span>{error?error:"Live • 1 minute candles"}</span></div></div>
}
