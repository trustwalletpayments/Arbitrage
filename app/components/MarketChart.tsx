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

      const fallbackTimer=window.setTimeout(()=>{if(!cancelled)setReady(true)},2500);
      return()=>window.clearTimeout(fallbackTimer);
    };

    const cleanup=mountWidget();
    return()=>{
      cancelled=true;
      if(typeof cleanup==="function")cleanup();
      if(containerRef.current)containerRef.current.innerHTML="";
    };
  },[symbol,interval]);

  const intervals:ChartInterval[]=["1m","15m","1h","4h","1d"];

  return <div className="chart live-chart tradingview-chart">
    <div className="chart-toolbar">
      <div className="chart-intervals" role="tablist" aria-label="Chart timeframe">
        {intervals.map(value=><button key={value} type="button" role="tab" aria-selected={interval===value} className={interval===value?"active":""} onClick={()=>setInterval(value)}>{value}</button>)}
      </div>
      <strong>{pair}</strong>
      <span className="tradingview-label">TradingView</span>
    </div>
    <div ref={containerRef} className="tradingview-widget-container" style={{height:"calc(100% - 58px)",width:"100%",minHeight:360}} />
    {!ready&&<div className="chart-placeholder">Loading TradingView chart…</div>}
  </div>;
}
