"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {binanceSymbol,formatPrice} from "../../lib/market-data";

type ChartInterval="1m"|"15m"|"1h"|"4h"|"1d";
type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
type Crosshair={x:number;y:number;index:number}|null;

const intervals:Record<ChartInterval,string>={"1m":"1m","15m":"15m","1h":"1h","4h":"4h","1d":"1d"};
const MIN_VISIBLE=35;
const MAX_VISIBLE=180;

export default function OrbitexMarketChart({pair}:{pair:string}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const dragRef=useRef<{x:number;start:number;end:number}|null>(null);
  const [interval,setInterval]=useState<ChartInterval>("1m");
  const [candles,setCandles]=useState<Candle[]>([]);
  const [range,setRange]=useState({start:120,end:220});
  const [crosshair,setCrosshair]=useState<Crosshair>(null);
  const [showMA,setShowMA]=useState(true);
  const [showVolume,setShowVolume]=useState(true);
  const symbol=binanceSymbol(pair);

  useEffect(()=>{
    let alive=true;
    let socket:WebSocket|undefined;
    setCandles([]);
    setCrosshair(null);
    setRange({start:0,end:0});
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${intervals[interval]}&limit=500`,{cache:"no-store"})
      .then(r=>r.json())
      .then(rows=>{
        if(!alive||!Array.isArray(rows))return;
        const next=rows.map((r:any)=>({time:+r[0],open:+r[1],high:+r[2],low:+r[3],close:+r[4],volume:+r[5]})) as Candle[];
        setCandles(next);
        setRange({start:Math.max(0,next.length-100),end:next.length});
      }).catch(()=>{});
    try{
      socket=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${intervals[interval]}`);
      socket.onmessage=e=>{
        try{
          const k=JSON.parse(e.data)?.k;
          if(!k||!alive)return;
          const next={time:+k.t,open:+k.o,high:+k.h,low:+k.l,close:+k.c,volume:+k.v} as Candle;
          setCandles(current=>{
            const oldLength=current.length;
            const a=current.slice();
            const i=a.findIndex(x=>x.time===next.time);
            if(i>=0)a[i]=next;else a.push(next);
            const trimmed=a.slice(-500);
            setRange(prev=>{
              const following=prev.end>=oldLength-1;
              if(following){const end=trimmed.length;const count=Math.min(Math.max(end-prev.start,MIN_VISIBLE),MAX_VISIBLE);return {start:Math.max(0,end-count),end}}
              return {start:Math.max(0,Math.min(prev.start,trimmed.length-MIN_VISIBLE)),end:Math.min(prev.end,trimmed.length)};
            });
            return trimmed;
          });
        }catch{}
      };
    }catch{}
    return()=>{alive=false;socket?.close()};
  },[symbol,interval]);

  const visible=useMemo(()=>{
    const start=Math.max(0,Math.min(range.start,candles.length));
    const end=Math.max(start,Math.min(range.end,candles.length));
    return candles.slice(start,end);
  },[candles,range]);

  useEffect(()=>{
    const canvas=canvasRef.current,wrap=wrapRef.current;
    if(!canvas||!wrap)return;
    const draw=()=>{
      const r=wrap.getBoundingClientRect();
      const d=window.devicePixelRatio||1;
      const w=Math.max(1,r.width),h=Math.max(1,r.height);
      canvas.width=Math.max(1,Math.floor(w*d));
      canvas.height=Math.max(1,Math.floor(h*d));
      const ctx=canvas.getContext("2d");
      if(!ctx)return;
      ctx.setTransform(d,0,0,d,0,0);
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle="#070b11";ctx.fillRect(0,0,w,h);
      const left=12,right=72,top=14,bottom=34;
      const volH=showVolume?Math.max(58,Math.min(92,h*.17)):0;
      const chartH=Math.max(100,h-top-bottom-volH);
      const plotW=Math.max(40,w-left-right);
      if(visible.length<2){ctx.fillStyle="#718096";ctx.font="13px system-ui";ctx.fillText("Loading market data…",18,30);return}
      const hi=Math.max(...visible.map(c=>c.high));
      const lo=Math.min(...visible.map(c=>c.low));
      const pad=(hi-lo)*.07||Math.max(hi*.001,.000001);
      const max=hi+pad,min=Math.max(0,lo-pad);
      const step=plotW/visible.length;
      const bw=Math.max(2,Math.min(16,step*.68));
      const y=(p:number)=>top+(max-p)/(max-min)*chartH;
      const xAt=(i:number)=>left+i*step+step/2;

      ctx.lineWidth=1;ctx.strokeStyle="#18222e";
      for(let i=0;i<=6;i++){const gy=top+chartH*i/6;ctx.beginPath();ctx.moveTo(left,gy+.5);ctx.lineTo(w-right,gy+.5);ctx.stroke()}
      for(let i=0;i<=8;i++){const gx=left+plotW*i/8;ctx.beginPath();ctx.moveTo(gx+.5,top);ctx.lineTo(gx+.5,top+chartH);ctx.stroke()}

      const maxVol=Math.max(...visible.map(c=>c.volume))||1;
      if(showVolume){
        ctx.fillStyle="#5b6b7e";ctx.font="10px system-ui";ctx.textAlign="left";ctx.fillText("VOLUME",left,top+chartH+16);
        visible.forEach((c,i)=>{const x=xAt(i),vh=(c.volume/maxVol)*(volH-18);ctx.fillStyle=c.close>=c.open?"rgba(32,217,160,.42)":"rgba(239,77,104,.42)";ctx.fillRect(x-bw/2,top+chartH+volH-vh,bw,vh)});
      }

      visible.forEach((c,i)=>{
        const x=xAt(i),up=c.close>=c.open;
        ctx.strokeStyle=up?"#20d9a0":"#ef4d68";ctx.lineWidth=Math.max(1,Math.min(2,step*.14));
        ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();
        const a=y(c.open),b=y(c.close);ctx.fillStyle=up?"#20d9a0":"#ef4d68";ctx.fillRect(x-bw/2,Math.min(a,b),bw,Math.max(1,Math.abs(a-b)));
      });

      if(showMA){
        const drawMA=(period:number,stroke:string)=>{
          ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.beginPath();let started=false;
          visible.forEach((_,i)=>{
            const global=range.start+i;const from=Math.max(0,global-period+1);const source=candles.slice(from,global+1);if(source.length<period)return;
            const avg=source.reduce((sum,c)=>sum+c.close,0)/source.length;const x=xAt(i),yy=y(avg);if(!started){ctx.moveTo(x,yy);started=true}else ctx.lineTo(x,yy);
          });ctx.stroke();
        };
        drawMA(20,"#f0c933");drawMA(50,"#8f7cff");
      }

      const last=visible[visible.length-1];
      const ly=y(last.close);
      ctx.strokeStyle=last.close>=last.open?"#20d9a0":"#ef4d68";ctx.setLineDash([5,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,ly);ctx.lineTo(w-right,ly);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=last.close>=last.open?"#20d9a0":"#ef4d68";ctx.fillRect(w-right+4,ly-10,right-8,20);ctx.fillStyle="#06100d";ctx.font="600 11px system-ui";ctx.textAlign="center";ctx.fillText(formatPrice(last.close),w-right/2+4,ly+4);

      ctx.fillStyle="#718096";ctx.font="10px system-ui";ctx.textAlign="right";
      for(let i=0;i<=6;i++)ctx.fillText(formatPrice(max-(max-min)*i/6),w-8,top+chartH*i/6+4);
      ctx.textAlign="center";
      for(let i=0;i<=6;i++){
        const idx=Math.min(visible.length-1,Math.floor((visible.length-1)*i/6));const c=visible[idx];const label=interval==="1d"?new Date(c.time).toLocaleDateString(undefined,{month:"short",day:"numeric"}):new Date(c.time).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});ctx.fillText(label,xAt(idx),h-9);
      }

      if(crosshair&&crosshair.index>=0&&crosshair.index<visible.length){
        const c=visible[crosshair.index],x=xAt(crosshair.index),yy=Math.max(top,Math.min(top+chartH,crosshair.y));
        ctx.strokeStyle="#657489";ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+chartH);ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();ctx.setLineDash([]);
        const labelY=Math.max(16,Math.min(h-16,yy));ctx.fillStyle="#202b39";ctx.fillRect(w-right+3,labelY-10,right-8,20);ctx.fillStyle="#dce5f0";ctx.font="600 10px system-ui";ctx.textAlign="center";ctx.fillText(formatPrice(max-(labelY-top)/chartH*(max-min)),w-right/2+4,labelY+3);
        const timeLabel=interval==="1d"?new Date(c.time).toLocaleDateString():new Date(c.time).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
        const boxW=245,boxH=42,bx=Math.min(Math.max(left,x-boxW/2),Math.max(left,w-right-boxW));const by=top+5;ctx.fillStyle="rgba(9,14,21,.94)";ctx.fillRect(bx,by,boxW,boxH);ctx.strokeStyle="#263547";ctx.strokeRect(bx+.5,by+.5,boxW-1,boxH-1);ctx.fillStyle="#dce5f0";ctx.textAlign="left";ctx.font="10px system-ui";ctx.fillText(timeLabel,bx+8,by+14);ctx.fillStyle="#9aa9bb";ctx.fillText(`O ${formatPrice(c.open)}   H ${formatPrice(c.high)}   L ${formatPrice(c.low)}   C ${formatPrice(c.close)}`,bx+8,by+30);
      }
    };
    draw();
    const ro=new ResizeObserver(draw);ro.observe(wrap);
    return()=>ro.disconnect();
  },[candles,visible,range,crosshair,interval,showMA,showVolume]);

  function indexFromClientX(clientX:number){
    const canvas=canvasRef.current;if(!canvas||visible.length<2)return 0;
    const r=canvas.getBoundingClientRect(),left=12,right=72,plotW=r.width-left-right,step=plotW/visible.length;
    return Math.max(0,Math.min(visible.length-1,Math.floor((clientX-r.left-left)/step)));
  }
  function pointerMove(e:any){
    const canvas=canvasRef.current;if(!canvas||visible.length<2)return;
    const r=canvas.getBoundingClientRect();
    if(dragRef.current){
      const step=(r.width-84)/visible.length;const delta=Math.round((e.clientX-dragRef.current.x)/step);const span=dragRef.current.end-dragRef.current.start;
      setRange(prev=>{const start=Math.max(0,Math.min(candles.length-span,dragRef.current!.start-delta));return {start,end:start+span}});
      return;
    }
    const index=indexFromClientX(e.clientX);const y=Math.max(14,Math.min(r.height-34,e.clientY-r.top));setCrosshair({x:e.clientX-r.left,y,index});
  }
  function pointerDown(e:any){if(!canvasRef.current||visible.length<2)return;dragRef.current={x:e.clientX,start:range.start,end:range.end};canvasRef.current.setPointerCapture?.(e.pointerId)}
  function pointerUp(e:any){dragRef.current=null;canvasRef.current?.releasePointerCapture?.(e.pointerId)}
  function wheel(e:any){
    e.preventDefault();if(visible.length<2)return;
    const canvas=canvasRef.current;if(!canvas)return;const r=canvas.getBoundingClientRect();const left=12,right=72,plotW=r.width-left-right;const mouseRatio=Math.max(0,Math.min(1,(e.clientX-r.left-left)/plotW));
    setRange(prev=>{const oldCount=prev.end-prev.start;const zoom=e.deltaY<0?.78:1.28;const nextCount=Math.max(MIN_VISIBLE,Math.min(MAX_VISIBLE,Math.round(oldCount*zoom)));const anchor=prev.start+Math.round(oldCount*mouseRatio);let start=anchor-Math.round(nextCount*mouseRatio);start=Math.max(0,Math.min(candles.length-nextCount,start));return {start,end:Math.min(candles.length,start+nextCount)}});
  }
  function resetView(){const end=candles.length;const count=Math.min(100,end);setRange({start:Math.max(0,end-count),end})}
  function zoom(delta:number){setRange(prev=>{const old=prev.end-prev.start;const next=Math.max(MIN_VISIBLE,Math.min(MAX_VISIBLE,old+delta));const center=(prev.start+prev.end)/2;const start=Math.max(0,Math.min(candles.length-next,Math.round(center-next/2)));return {start,end:start+next}})}

  return <div className="chart live-chart custom-market-chart" ref={wrapRef}>
    <div className="chart-toolbar custom-chart-toolbar">
      <div className="chart-intervals">{(Object.keys(intervals) as ChartInterval[]).map(x=><button key={x} className={interval===x?"active":""} onClick={()=>setInterval(x)}>{x}</button>)}</div>
      <div className="chart-tools">
        <button type="button" title="Zoom in" onClick={()=>zoom(-15)}>＋</button>
        <button type="button" title="Zoom out" onClick={()=>zoom(15)}>−</button>
        <button type="button" title="Reset chart view" onClick={resetView}>⌂</button>
        <button type="button" title="Toggle moving averages" className={showMA?"tool-active":""} onClick={()=>setShowMA(v=>!v)}>MA</button>
        <button type="button" title="Toggle volume" className={showVolume?"tool-active":""} onClick={()=>setShowVolume(v=>!v)}>VOL</button>
      </div>
      <strong>{pair}</strong><span className="chart-source">Orbitex Chart</span>
    </div>
    <div className="custom-chart-canvas-wrap">
      <canvas ref={canvasRef} onPointerMove={pointerMove} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={()=>{if(!dragRef.current)setCrosshair(null)}} onWheel={wheel}/>
      <div className="chart-help">Drag to pan · Scroll to zoom · Hover for OHLC</div>
    </div>
  </div>;
}
