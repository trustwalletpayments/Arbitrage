"use client";

import {useEffect,useRef,useState} from "react";
import {binanceSymbol} from "../../lib/market-data";

type ChartInterval="1m"|"15m"|"1h"|"4h"|"1d";

const tradingViewInterval:Record<ChartInterval,string>={
  "1m":"1",
  "15m":"15",
  "1h":"60",
  "4h":"240",
  "1d":"D",
};

export default function MarketChart({pair}:{pair:string}){
  const containerRef=useRef<HTMLDivElement|null>(null);
  const [interval,setInterval]=useState<ChartInterval>("1m");
  const [ready,setReady]=useState(false);
  const symbol=binanceSymbol(pair);

  useEffect(()=>{
    let cancelled=false;
    setReady(false);

    const mountWidget=()=>{
      if(cancelled||!containerRef.current)return;
      const container=containerRef.current;
      container.innerHTML="";

      const widget=document.createElement("div");
      widget.className="tradingview-widget-container__widget";
      widget.style.height="100%";
      widget.style.width="100%";
      container.appendChild(widget);

      const script=document.createElement("script");
      script.src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type="text/javascript";
      script.async=true;
      script.innerHTML=JSON.stringify({
        autosize:true,
        symbol:`BINANCE:${symbol}`,
        interval:tradingViewInterval[interval],
        timezone:"Etc/UTC",
        theme:"dark",
        style:"1",
        locale:"en",
        enable_publishing:false,
        allow_symbol_change:false,
        hide_top_toolbar:false,
        hide_legend:false,
        save_image:false,
        hide_volume:false,
        support_host:"https://www.tradingview.com",
      });
      script.onload=()=>{if(!cancelled)setReady(true)};
      container.appendChild(script);
      const timer=window.setTimeout(()=>{if(!cancelled)setReady(true)},2500);
      return()=>window.clearTimeout(timer);
    };

    const cleanup=mountWidget();
    return()=>{
      cancelled=true;
      if(typeof cleanup==="function")cleanup();
      if(containerRef.current)containerRef.current.innerHTML="";
    };
  },[symbol,interval]);

  const intervals:ChartInterval[]=["1m","15m","1h","4h","1d"];

  return <div className="chart live-chart tradingview-chart" style={{height:560,minHeight:560,display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"flex-start",overflow:"hidden"}}>
    <div className="chart-toolbar" style={{height:58,minHeight:58,display:"flex",alignItems:"center",gap:10,padding:"0 14px",background:"#0b111a",borderBottom:"1px solid #1b2433"}}>
      <div className="chart-intervals" role="tablist" aria-label="Chart timeframe" style={{display:"flex",alignItems:"center",gap:6}}>
        {intervals.map(value=><button key={value} type="button" role="tab" aria-selected={interval===value} className={interval===value?"active":""} onClick={()=>setInterval(value)} style={{appearance:"none",border:"1px solid",borderColor:interval===value?"#3b82f6":"#263244",background:interval===value?"#2563eb":"#111a27",color:interval===value?"#fff":"#91a0b5",borderRadius:7,padding:"7px 11px",fontSize:12,fontWeight:600,lineHeight:1,cursor:"pointer"}}>{value}</button>)}
      </div>
      <strong style={{marginLeft:"auto",fontSize:15,color:"#e8eef7"}}>{pair}</strong>
      <span className="tradingview-label" style={{color:"#7f8da1",fontSize:12}}>TradingView</span>
    </div>
    <div ref={containerRef} className="tradingview-widget-container" style={{height:"auto",minHeight:0,flex:"1 1 auto",width:"100%",position:"relative"}} />
    {!ready&&<div className="chart-placeholder" style={{position:"absolute",inset:"58px 0 0",display:"grid",placeItems:"center",pointerEvents:"none"}}>Loading TradingView chart…</div>}
  </div>;
}
