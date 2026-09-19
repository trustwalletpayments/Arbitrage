"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {binanceSymbol,formatPrice} from "../../lib/market-data";

type ChartInterval="1m"|"5m"|"15m"|"1h"|"4h"|"1d"|"1w";
type DrawMode="crosshair"|"trend"|"horizontal";
type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
type Point={x:number;y:number};
type TrendLine={a:Point;b:Point};

const intervals:Record<ChartInterval,string>={"1m":"1m","5m":"5m","15m":"15m","1h":"1h","4h":"4h","1d":"1d","1w":"1w"};
const MIN_VISIBLE=30;
const MAX_VISIBLE=180;

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}

export default function OrbitexMarketChart({pair}:{pair:string}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const candlesRef=useRef<Candle[]>([]);
  const rangeRef=useRef({start:0,end:0});
  const drawModeRef=useRef<DrawMode>("crosshair");
  const crosshairRef=useRef<{x:number;y:number;index:number}|null>(null);
  const trendStartRef=useRef<Point|null>(null);
  const previewTrendRef=useRef<TrendLine|null>(null);
  const trendsRef=useRef<TrendLine[]>([]);
  const horizontalRef=useRef<number[]>([]);
  const panRef=useRef<{x:number;start:number;end:number}|null>(null);
  const rafRef=useRef<number|0>(0);
  const dprRef=useRef(1);

  const [interval,setInterval]=useState<ChartInterval>("1m");
  const [candles,setCandles]=useState<Candle[]>([]);
  const [range,setRange]=useState({start:0,end:0});
  const [drawMode,setDrawMode]=useState<DrawMode>("crosshair");
  const [showMA,setShowMA]=useState(true);
  const [showVolume,setShowVolume]=useState(true);
  const [autoScale,setAutoScale]=useState(true);
  const symbol=binanceSymbol(pair);

  const syncRange=(next:{start:number;end:number})=>{
    rangeRef.current=next;
    setRange(next);
  };

  const requestDraw=useCallback(()=>{
    if(rafRef.current) return;
    rafRef.current=window.requestAnimationFrame(()=>{
      rafRef.current=0;
      const canvas=canvasRef.current,wrap=wrapRef.current;
      if(!canvas||!wrap)return;
      drawChart(canvas,wrap,candlesRef.current,rangeRef.current,interval,showMA,showVolume,autoScale,crosshairRef.current,trendsRef.current,horizontalRef.current,previewTrendRef.current);
    });
  },[interval,showMA,showVolume,autoScale]);

  useEffect(()=>{
    candlesRef.current=candles;
    requestDraw();
  },[candles,requestDraw]);

  useEffect(()=>{
    drawModeRef.current=drawMode;
    trendStartRef.current=null;
    previewTrendRef.current=null;
    requestDraw();
  },[drawMode,requestDraw]);

  useEffect(()=>{
    let alive=true;
    let socket:WebSocket|undefined;
    candlesRef.current=[];
    trendsRef.current=[];
    horizontalRef.current=[];
    crosshairRef.current=null;
    syncRange({start:0,end:0});
    setCandles([]);

    fetch(\`https://api.binance.com/api/v3/klines?symbol=\${symbol}&interval=\${intervals[interval]}&limit=500\`,{cache:"no-store"})
      .then(r=>r.json())
      .then(rows=>{
        if(!alive||!Array.isArray(rows))return;
        const next=rows.map((r:any)=>({time:+r[0],open:+r[1],high:+r[2],low:+r[3],close:+r[4],volume:+r[5]})) as Candle[];
        candlesRef.current=next;
        const end=next.length;
        syncRange({start:Math.max(0,end-100),end});
        setCandles(next);
      }).catch(()=>{});

    try{
      socket=new WebSocket(\`wss://stream.binance.com:9443/ws/\${symbol.toLowerCase()}@kline_\${intervals[interval]}\`);
      socket.onmessage=e=>{
        try{
          const k=JSON.parse(e.data)?.k;
          if(!k||!alive)return;
          const next={time:+k.t,open:+k.o,high:+k.h,low:+k.l,close:+k.c,volume:+k.v} as Candle[];
          const current=candlesRef.current;
          const a=current.length?current.slice():[];
          const i=a.findIndex(x=>x.time===next.time);
          if(i>=0)a[i]=next;else a.push(next);
          const trimmed=a.slice(-500);
          candlesRef.current=trimmed;
          const prev=rangeRef.current;
          const wasFollowing=prev.end>=current.length-1;
          if(wasFollowing){
            const end=trimmed.length;
            const count=clamp(end-Math.max(0,prev.start),MIN_VISIBLE,MAX_VISIBLE);
            syncRange({start:Math.max(0,end-count),end});
          }else{
            syncRange({start:clamp(prev.start,0,Math.max(0,trimmed.length-MIN_VISIBLE)),end:clamp(prev.end,MIN_VISIBLE,trimmed.length)});
          }
          requestDraw();
          if(i<0)setCandles(trimmed);
        }catch{}
      };
    }catch{}

    return()=>{alive=false;socket?.close()};
  },[symbol,interval]);

  useEffect(()=>{
    const ro=new ResizeObserver(()=>requestDraw());
    if(wrapRef.current)ro.observe(wrapRef.current);
    const canvas=canvasRef.current;
    if(canvas)canvas.addEventListener("wheel",onWheel,{passive:false});
    return()=>{
      ro.disconnect();
      if(canvas)canvas.removeEventListener("wheel",onWheel);
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
    };
  },[requestDraw]);

  const visible=useMemo(()=>{
    const start=clamp(range.start,0,candles.length);
    const end=clamp(range.end,start,candles.length);
    return candles.slice(start,end);
  },[candles,range]);

  function setMode(mode:DrawMode){
    setDrawMode(mode);
  }

  function clearDrawings(){
    trendsRef.current=[];
    horizontalRef.current=[];
    trendStartRef.current=null;
    previewTrendRef.current=null;
    requestDraw();
  }

  function resetView(){
    const end=candlesRef.current.length;
    const count=Math.min(100,end);
    setAutoScale(true);
    syncRange({start:Math.max(0,end-count),end});
    requestDraw();
  }

  function zoom(delta:number){
    const total=candlesRef.current.length;
    if(total<2)return;
    const prev=rangeRef.current;
    const old=prev.end-prev.start;
    const next=clamp(old+delta,MIN_VISIBLE,Math.min(MAX_VISIBLE,total));
    const center=(prev.start+prev.end)/2;
    const start=clamp(Math.round(center-next/2),0,Math.max(0,total-next));
    syncRange({start,end:start+next});
    requestDraw();
  }

  function onWheel(e:WheelEvent){
    e.preventDefault();
    if(candlesRef.current.length<2)return;
    const canvas=canvasRef.current;
    if(!canvas)return;
    const r=canvas.getBoundingClientRect();
    const left=18,right=78,plotW=Math.max(30,r.width-left-right);
    const mouseRatio=clamp((e.clientX-r.left-left)/plotW,0,1);
    const prev=rangeRef.current;
    const oldCount=prev.end-prev.start;
    const zoomFactor=e.deltaY<0?.82:1.22;
    const nextCount=clamp(Math.round(oldCount*zoomFactor),MIN_VISIBLE,Math.min(MAX_VISIBLE,candlesRef.current.length));
    const anchor=prev.start+Math.round(oldCount*mouseRatio);
    const start=clamp(anchor-Math.round(nextCount*mouseRatio),0,Math.max(0,candlesRef.current.length-nextCount));
    syncRange({start,end:Math.min(candlesRef.current.length,start+nextCount)});
    requestDraw();
  }

  function indexFromClientX(clientX:number){
    const canvas=canvasRef.current;
    if(!canvas||visible.length<2)return 0;
    const r=canvas.getBoundingClientRect(),left=18,right=78,plotW=Math.max(30,r.width-left-right),step=plotW/visible.length;
    return clamp(Math.floor((clientX-r.left-left)/step),0,visible.length-1);
  }

  function clientPoint(e:React.PointerEvent<HTMLCanvasElement>):Point{
    const r=e.currentTarget.getBoundingClientRect();
    return {x:e.clientX-r.left,y:e.clientY-r.top};
  }

  function pointerMove(e:React.PointerEvent<HTMLCanvasElement>){
    const canvas=canvasRef.current;if(!canvas||visible.length<2)return;
    const p=clientPoint(e);
    if(panRef.current){
      const r=canvas.getBoundingClientRect(),step=Math.max(1,(r.width-96)/visible.length);
      const delta=Math.round((e.clientX-panRef.current.x)/step);
      const span=panRef.current.end-panRef.current.start;
      const start=clamp(panRef.current.start-delta,0,Math.max(0,candlesRef.current.length-span));
      syncRange({start,end:start+span});
      requestDraw();
      return;
    }
    const mode=drawModeRef.current;
    if(mode==="trend"&&trendStartRef.current){
      previewTrendRef.current={a:trendStartRef.current,b:p};
      requestDraw();
      return;
    }
    if(mode==="crosshair"){
      const index=indexFromClientX(e.clientX);
      crosshairRef.current={x:p.x,y:p.y,index};
      requestDraw();
    }
  }

  function pointerDown(e:React.PointerEvent<HTMLCanvasElement>){
    const canvas=e.currentTarget;
    const p=clientPoint(e);
    const mode=drawModeRef.current;
    if(mode==="trend"){
      if(!trendStartRef.current){
        trendStartRef.current=p;
        previewTrendRef.current={a:p,b:p};
        canvas.setPointerCapture?.(e.pointerId);
      }else{
        trendsRef.current.push({a:trendStartRef.current,b:p});
        trendStartRef.current=null;
        previewTrendRef.current=null;
        setDrawMode("crosshair");
      }
      requestDraw();
      return;
    }
    if(mode==="horizontal"){
      horizontalRef.current.push(clamp(p.y,14,Math.max(14,canvas.clientHeight-42)));
      setDrawMode("crosshair");
      requestDraw();
      return;
    }
    if(e.shiftKey){
      panRef.current={x:e.clientX,start:rangeRef.current.start,end:rangeRef.current.end};
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }
    crosshairRef.current={x:p.x,y:p.y,index:indexFromClientX(e.clientX)};
    requestDraw();
  }

  function pointerUp(e:React.PointerEvent<HTMLCanvasElement>){
    panRef.current=null;
    try{e.currentTarget.releasePointerCapture?.(e.pointerId)}catch{}
  }

  function pointerLeave(){
    if(drawModeRef.current==="crosshair"&&!panRef.current){
      crosshairRef.current=null;
      requestDraw();
    }
  }

  return <div className="chart live-chart custom-market-chart" ref={wrapRef}>
    <div className="chart-toolbar custom-chart-toolbar">
      <div className="chart-group chart-intervals">
        {(Object.keys(intervals) as ChartInterval[]).map(x=><button key={x} className={interval===x?"active":""} onClick={()=>setInterval(x)}>{x}</button>)}
      </div>
      <div className="chart-divider"/>
      <div className="chart-group chart-tools">
        <button className={drawMode==="crosshair"?"tool-active":""} title="Crosshair" onClick={()=>setMode("crosshair")}>⌖</button>
        <button className={drawMode==="trend"?"tool-active":""} title="Trend line — click two points" onClick={()=>setMode("trend")}>╱</button>
        <button className={drawMode==="horizontal"?"tool-active":""} title="Horizontal price line" onClick={()=>setMode("horizontal")}>━</button>
        <button title="Clear drawings" onClick={clearDrawings}>CLR</button>
        <button title="Zoom in" onClick={()=>zoom(-15)}>＋</button>
        <button title="Zoom out" onClick={()=>zoom(15)}>−</button>
        <button title="Reset view" onClick={resetView}>AUTO</button>
        <button className={showMA?"tool-active":""} title="Toggle moving averages" onClick={()=>setShowMA(v=>!v)}>MA</button>
        <button className={showVolume?"tool-active":""} title="Toggle volume" onClick={()=>setShowVolume(v=>!v)}>VOL</button>
      </div>
      <div className="chart-readout">
        <strong>{pair}</strong>
        <span>{formatPrice(candlesRef.current[candlesRef.current.length-1]?.close||0)}</span>
      </div>
      <span className="chart-source">Orbitex Chart</span>
    </div>
    <div className="custom-chart-canvas-wrap">
      <canvas
        ref={canvasRef}
        onPointerMove={pointerMove}
        onPointerDown={pointerDown}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onPointerLeave={pointerLeave}
      />
      <div className="chart-help">Hover for crosshair · Shift + drag to pan · Scroll to zoom · Trend/line tools for analysis</div>
    </div>
  </div>;
}

function drawChart(
  canvas:HTMLCanvasElement,
  wrap:HTMLDivElement,
  candles:Candle[],
  range:{start:number;end:number},
  interval:ChartInterval,
  showMA:boolean,
  showVolume:boolean,
  autoScale:boolean,
  crosshair:{x:number;y:number;index:number}|null,
  trends:TrendLine[],
  horizontal:number[],
  previewTrend:TrendLine|null
){
  const r=wrap.getBoundingClientRect();
  const d=window.devicePixelRatio||1;
  dpr(canvas,d);
  const w=Math.max(1,r.width),h=Math.max(1,r.height);
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  ctx.setTransform(d,0,0,d,0,0);
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle="#070b11";
  ctx.fillRect(0,0,w,h);

  const start=clamp(range.start,0,candles.length);
  const end=clamp(range.end,start,candles.length);
  const visible=candles.slice(start,end);
  const left=18,right=78,top=16,bottom=36;
  const volH=showVolume?Math.max(54,Math.min(82,h*.17)):0;
  const chartH=Math.max(120,h-top-bottom-volH);
  const plotW=Math.max(40,w-left-right);

  if(visible.length<2){
    ctx.fillStyle="#718096";ctx.font="13px system-ui";ctx.fillText("Loading market data…",20,32);
    return;
  }

  const hi=Math.max(...visible.map(c=>c.high));
  const lo=Math.min(...visible.map(c=>c.low));
  const rawSpan=Math.max(hi-lo,1e-9);
  const pad=autoScale?rawSpan*.06:rawSpan*.045;
  const max=hi+pad,min=Math.max(0,lo-pad);
  const span=max-min||1;
  const step=plotW/visible.length;
  const bw=Math.max(2,Math.min(13,step*.66));
  const y=(price:number)=>top+(max-price)/span*chartH;
  const xAt=(i:number)=>left+i*step+step/2;

  ctx.strokeStyle="#17212d";
  ctx.lineWidth=1;
  for(let i=0;i<=6;i++){
    const gy=top+chartH*i/6;
    ctx.beginPath();ctx.moveTo(left,gy+.5);ctx.lineTo(w-right,gy+.5);ctx.stroke();
  }
  for(let i=0;i<=8;i++){
    const gx=left+plotW*i/8;
    ctx.beginPath();ctx.moveTo(gx+.5,top);ctx.lineTo(gx+.5,top+chartH);ctx.stroke();
  }

  if(showVolume){
    const maxVol=Math.max(...visible.map(c=>c.volume))||1;
    visible.forEach((c,i)=>{
      const vh=(c.volume/maxVol)*(volH-16);
      ctx.fillStyle=c.close>=c.open?"rgba(32,217,160,.28)":"rgba(239,77,104,.28)";
      ctx.fillRect(xAt(i)-Math.max(2,bw*.45),top+chartH+volH-vh,bw,Math.max(1,vh));
    });
    ctx.fillStyle="#5e6d7f";
    ctx.font="10px system-ui";
    ctx.textAlign="left";
    ctx.fillText("VOLUME",left,top+chartH+14);
  }

  visible.forEach((c,i)=>{
    const x=xAt(i),up=c.close>=c.open;
    ctx.strokeStyle=up?"#20d9a0":"#ef4d68";
    ctx.lineWidth=Math.max(1,Math.min(2,step*.12));
    ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();
    const oa=y(c.open),ca=y(c.close);
    ctx.fillStyle=up?"#20d9a0":"#ef4d68";
    ctx.fillRect(x-bw/2,Math.min(oa,ca),bw,Math.max(1,Math.abs(ca-oa)));
  });

  if(showMA){
    drawMA(ctx,candles,start,visible,20,xAt,y,"#f0c933");
    drawMA(ctx,candles,start,visible,50,xAt,y,"#8f7cff");
  }

  const last=visible[visible.length-1];
  const currentY=y(last.close);
  ctx.strokeStyle=last.close>=last.open?"rgba(32,217,160,.75)":"rgba(239,77,104,.75)";
  ctx.setLineDash([5,5]);
  ctx.beginPath();ctx.moveTo(left,currentY);ctx.lineTo(w-right,currentY);ctx.stroke();
  ctx.setLineDash([]);

  drawPriceTag(ctx,w,right,currentY,formatPrice(last.close),last.close>=last.open);

  ctx.fillStyle="#748397";
  ctx.font="10px system-ui";
  ctx.textAlign="right";
  for(let i=0;i<=6;i++){
    const price=max-span*i/6;
    ctx.fillText(formatPrice(price),w-10,top+chartH*i/6+4);
  }

  ctx.textAlign="center";
  for(let i=0;i<=6;i++){
    const idx=Math.min(visible.length-1,Math.floor((visible.length-1)*i/6));
    const c=visible[idx];
    const date=new Date(c.time);
    const label=interval==="1d"||interval==="1w"?date.toLocaleDateString(undefined,{month:"short",day:"numeric"}):date.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
    ctx.fillStyle="#647387";ctx.fillText(label,xAt(idx),h-10);
  }

  [...trends,...(previewTrend?[previewTrend]:[])].forEach(line=>{
    ctx.strokeStyle="#4da3ff";
    ctx.lineWidth=1.5;
    ctx.setLineDash([0,0]);
    ctx.beginPath();ctx.moveTo(line.a.x,line.a.y);ctx.lineTo(line.b.x,line.b.y);ctx.stroke();
    drawHandle(ctx,line.a);drawHandle(ctx,line.b);
  });

  horizontal.forEach(lineY=>{
    const yy=clamp(lineY,top,top+chartH);
    ctx.strokeStyle="#4da3ff";ctx.lineWidth=1.2;ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();ctx.setLineDash([]);
    const price=max-(yy-top)/chartH*span;
    drawPriceTag(ctx,w,right,yy,formatPrice(price),true,true);
  });

  if(crosshair&&crosshair.index>=0&&crosshair.index<visible.length){
    const c=visible[crosshair.index];
    const x=xAt(crosshair.index);
    const yy=clamp(crosshair.y,top,top+chartH);
    ctx.strokeStyle="rgba(128,145,165,.75)";
    ctx.lineWidth=1;
    ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+chartH);ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();
    ctx.setLineDash([]);

    const crossPrice=max-(yy-top)/chartH*span;
    drawPriceTag(ctx,w,right,yy,formatPrice(crossPrice),false,true);

    const timeLabel=interval==="1d"||interval==="1w"?new Date(c.time).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):new Date(c.time).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
    const boxW=252,boxH=58;
    const bx=clamp(x-boxW/2,left,Math.max(left,w-right-boxW));
    const by=top+8;
    ctx.fillStyle="rgba(7,11,17,.96)";ctx.fillRect(bx,by,boxW,boxH);
    ctx.strokeStyle="#2a3a4d";ctx.strokeRect(bx+.5,by+.5,boxW-1,boxH-1);
    ctx.textAlign="left";ctx.fillStyle="#dce5f0";ctx.font="600 11px system-ui";ctx.fillText(timeLabel,bx+10,by+17);
    ctx.fillStyle="#90a0b4";ctx.font="10px system-ui";
    ctx.fillText(\`O \${formatPrice(c.open)}   H \${formatPrice(c.high)}   L \${formatPrice(c.low)}   C \${formatPrice(c.close)}\`,bx+10,by+37);
    ctx.fillStyle="#5e6e81";ctx.fillText(\`VOL \${formatCompactVolume(c.volume)}\`,bx+10,by+50);
  }
}

function dpr(canvas:HTMLCanvasElement,d:number){
  const wrap=canvas.parentElement;
  if(!wrap)return;
  const r=wrap.getBoundingClientRect();
  const w=Math.max(1,r.width),h=Math.max(1,r.height);
  if(canvas.width!==Math.floor(w*d)||canvas.height!==Math.floor(h*d)){
    canvas.width=Math.floor(w*d);
    canvas.height=Math.floor(h*d);
    canvas.style.width=\`\${w}px\`;
    canvas.style.height=\`\${h}px\`;
  }
}

function drawMA(
  ctx:CanvasRenderingContext2D,
  candles:Candle[],
  start:number,
  visible:Candle[],
  period:number,
  xAt:(i:number)=>number,
  y:(price:number)=>number,
  stroke:string
){
  ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.beginPath();
  let started=false;
  visible.forEach((_,i)=>{
    const global=start+i;
    const from=Math.max(0,global-period+1);
    const source=candles.slice(from,global+1);
    if(source.length<period)return;
    const avg=source.reduce((sum,c)=>sum+c.close,0)/source.length;
    const xx=xAt(i),yy=y(avg);
    if(!started){ctx.moveTo(xx,yy);started=true}else ctx.lineTo(xx,yy);
  });
  ctx.stroke();
}

function drawPriceTag(ctx:CanvasRenderingContext2D,w:number,right:number,y:number,label:string,positive:boolean,secondary=false){
  const h=secondary?18:22;
  const tagW=Math.min(74,Math.max(64,label.length*7+14));
  const x=w-right+2;
  const yy=clamp(y-h/2,4,ctx.canvas.height/(window.devicePixelRatio||1)-h-4);
  ctx.fillStyle=secondary?"#1a2635":positive?"#1dd5a0":"#ef4d68";
  ctx.fillRect(x,yy,tagW,h);
  ctx.fillStyle=secondary?"#dce5f0":"#04100d";
  ctx.font=\`600 \${secondary?9:10}px system-ui\`;
  ctx.textAlign="center";
  ctx.fillText(label,x+tagW/2,yy+h/2+3);
}

function drawHandle(ctx:CanvasRenderingContext2D,p:Point){
  ctx.fillStyle="#4da3ff";ctx.strokeStyle="#07111c";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();ctx.stroke();
}

function formatCompactVolume(v:number){
  if(v>=1e9)return \`\${(v/1e9).toFixed(1)}B\`;
  if(v>=1e6)return \`\${(v/1e6).toFixed(1)}M\`;
  if(v>=1e3)return \`\${(v/1e3).toFixed(1)}K\`;
  return v.toFixed(0);
}
