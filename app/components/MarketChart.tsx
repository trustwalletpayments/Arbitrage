"use client";

import {useEffect,useMemo,useState} from "react";
import {binanceSymbol,formatPrice} from "../../lib/market-data";

type Candle={time:number;open:number;high:number;low:number;close:number};
type ChartInterval="1m"|"15m"|"1h"|"4h"|"1d";

const BINANCE_API_HOSTS=["https://api.binance.com","https://api1.binance.com","https://api2.binance.com","https://api3.binance.com"];

function parseCandle(row:unknown):Candle|null{
  if(!Array.isArray(row)||row.length<6)return null;
  const [time,open,high,low,close]=row;
  const values=[Number(time),Number(open),Number(high),Number(low),Number(close)];
  if(values.some(value=>!Number.isFinite(value)))return null;
  return {time:values[0],open:values[1],high:values[2],low:values[3],close:values[4]};
}

export default function MarketChart({pair}:{pair:string}){
  const [interval,setInterval]=useState<ChartInterval>("1m");
  const [candles,setCandles]=useState<Candle[]>([]);
  const [error,setError]=useState("");
  const symbol=binanceSymbol(pair);

  useEffect(()=>{
    let alive=true;
    let socket:WebSocket|null=null;
    let reconnectTimer:ReturnType<typeof setTimeout>|undefined;
    let reconnectAttempts=0;
    setError("");
    setCandles([]);

    async function loadHistory(){
      for(const host of BINANCE_API_HOSTS){
        try{
          const response=await fetch(`${host}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=100`,{cache:"no-store"});
          if(!response.ok)continue;
          const rows=await response.json();
          const parsed=Array.isArray(rows)?rows.map(parseCandle).filter((c):c is Candle=>Boolean(c)):[];
          if(parsed.length){if(alive)setCandles(parsed);return true;}
        }catch{}
      }
      if(alive)setError("Unable to load this coin's chart");
      return false;
    }

    function connect(){
      if(!alive)return;
      try{
        socket=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
        socket.onopen=()=>{reconnectAttempts=0;setError("")};
        socket.onmessage=event=>{
          try{
            const k=JSON.parse(event.data)?.k;
            const next:Candle={time:Number(k?.t),open:Number(k?.o),high:Number(k?.h),low:Number(k?.l),close:Number(k?.c)};
            if(!Number.isFinite(next.time)||[next.open,next.high,next.low,next.close].some(value=>!Number.isFinite(value)))return;
            setCandles(previous=>{const copy=[...previous];const index=copy.findIndex(item=>item.time===next.time);if(index>=0)copy[index]=next;else copy.push(next);return copy.slice(-100)});
          }catch{}
        };
        socket.onerror=()=>socket?.close();
        socket.onclose=()=>{if(!alive)return;reconnectAttempts+=1;reconnectTimer=setTimeout(connect,Math.min(1000*reconnectAttempts,10000))};
      }catch{reconnectTimer=setTimeout(connect,5000)}
    }

    loadHistory();
    connect();
    return()=>{alive=false;if(reconnectTimer)clearTimeout(reconnectTimer);socket?.close()};
  },[symbol,interval]);

  const view=useMemo(()=>{
    if(!candles.length)return null;
    const width=1000,height=360,padX=18,padY=18;
    const min=Math.min(...candles.map(c=>c.low)),max=Math.max(...candles.map(c=>c.high));
    const range=Math.max(max-min,Number.EPSILON);
    const x=(i:number)=>padX+(i/Math.max(candles.length-1,1))*(width-padX*2);
    const y=(v:number)=>height-padY-((v-min)/range)*(height-padY*2);
    return {width,height,x,y};
  },[candles]);

  const intervals:ChartInterval[]=["1m","15m","1h","4h","1d"];
  return <div className="chart live-chart">
    <div className="chart-toolbar" style={{height:58,padding:"0 18px",gap:16,background:"#0b111a"}}>
      <div className="chart-intervals" role="tablist" aria-label="Chart timeframe" style={{display:"flex",alignItems:"center",gap:6}}>
        {intervals.map(value=><button key={value} type="button" className={interval===value?"active":""} onClick={()=>setInterval(value)} style={{appearance:"none",border:"1px solid",borderColor:interval===value?"#3b82f6":"#263244",background:interval===value?"#2563eb":"#111a27",color:interval===value?"#fff":"#91a0b5",borderRadius:7,padding:"7px 12px",fontSize:12,fontWeight:600,lineHeight:1,cursor:"pointer",transition:"all .2s"}}>{value}</button>)}
      </div>
      <strong style={{fontSize:14,color:"#e8eef7",fontVariantNumeric:"tabular-nums"}}>{candles.length?formatPrice(candles[candles.length-1].close):"—"}</strong>
    </div>
    {view&&<svg viewBox={`0 0 ${view.width} ${view.height}`} preserveAspectRatio="none" role="img" aria-label={`${pair} live candlestick chart`}>{[0.25,0.5,0.75].map(v=><line key={v} x1="0" x2={view.width} y1={view.height*v} y2={view.height*v} className="chart-grid-line"/>)}{candles.map((c,i)=>{const up=c.close>=c.open;const cx=view.x(i);const bodyTop=view.y(Math.max(c.open,c.close));const bodyBottom=view.y(Math.min(c.open,c.close));const bodyHeight=Math.max(1,bodyBottom-bodyTop);return <g key={c.time} className={up?"candle-up":"candle-down"}><line x1={cx} x2={cx} y1={view.y(c.high)} y2={view.y(c.low)}/><rect x={cx-3.2} y={bodyTop} width="6.4" height={bodyHeight} rx="1"/></g>})}</svg>}
    {!candles.length&&<div className="chart-placeholder">{error||"Loading live market data…"}</div>}
    <div className="chart-footer"><span>Binance public market feed</span><span>{error?error:`Live • ${interval} candles`}</span></div>
  </div>;
}
