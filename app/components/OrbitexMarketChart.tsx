"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {binanceSymbol,formatPrice} from "../../lib/market-data";

type ChartInterval="1m"|"5m"|"15m"|"1h"|"4h"|"1d"|"1w";
type DrawMode="crosshair"|"pan"|"trend"|"horizontal";
type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
type DrawingPoint={index:number;price:number};
type TrendLine={a:DrawingPoint;b:DrawingPoint};

const intervals:Record<ChartInterval,string>={"1m":"1m","5m":"5m","15m":"15m","1h":"1h","4h":"4h","1d":"1d","1w":"1w"};
const MIN_VISIBLE=30;
const MAX_VISIBLE=180;

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

function formatAxisPrice(value:number){
  if(!Number.isFinite(value))return "—";
  if(value>=1000)return value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  if(value>=1)return value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  if(value>=0.01)return value.toLocaleString(undefined,{minimumFractionDigits:4,maximumFractionDigits:4});
  return value.toLocaleString(undefined,{minimumFractionDigits:6,maximumFractionDigits:8});
}

export default function OrbitexMarketChart({pair}:{pair:string}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const candlesRef=useRef<Candle[]>([]);
  const rangeRef=useRef({start:0,end:0});
  const drawModeRef=useRef<DrawMode>("crosshair");
  const crosshairRef=useRef<{x:number;y:number;index:number}|null>(null);
  const trendStartRef=useRef<DrawingPoint|null>(null);
  const previewTrendRef=useRef<TrendLine|null>(null);
  const trendsRef=useRef<TrendLine[]>([]);
  const horizontalRef=useRef<number[]>([]);
  const panRef=useRef<{x:number;start:number;end:number}|null>(null);
  const rafRef=useRef<number|0>(0);
  const loadingRef=useRef(true);

  const [interval,setInterval]=useState<ChartInterval>("1m");
  const [drawMode,setDrawMode]=useState<DrawMode>("crosshair");
  const [showMA,setShowMA]=useState(true);
  const [showVolume,setShowVolume]=useState(true);
  const [autoScale,setAutoScale]=useState(true);
  const symbol=binanceSymbol(pair);

  const syncRange=useCallback((next:{start:number;end:number})=>{
    const current=rangeRef.current;
    if(current.start===next.start&&current.end===next.end)return;
    rangeRef.current=next;
  },[]);

  const requestDraw=useCallback(()=>{
    if(rafRef.current)return;
    rafRef.current=window.requestAnimationFrame(()=>{
      rafRef.current=0;
      const canvas=canvasRef.current,wrap=wrapRef.current;
      if(!canvas||!wrap)return;
      drawChart(
        canvas,
        wrap,
        candlesRef.current,
        rangeRef.current,
        interval,
        showMA,
        showVolume,
        autoScale,
        crosshairRef.current,
        trendsRef.current,
        horizontalRef.current,
        previewTrendRef.current,
        loadingRef.current
      );
    });
  },[interval,showMA,showVolume,autoScale]);

  useEffect(()=>{
    drawModeRef.current=drawMode;
    trendStartRef.current=null;
    previewTrendRef.current=null;
    crosshairRef.current=null;
    requestDraw();
  },[drawMode,requestDraw]);

  useEffect(()=>{
    let alive=true;
    let socket:WebSocket|undefined;
    candlesRef.current=[];
    trendsRef.current=[];
    horizontalRef.current=[];
    crosshairRef.current=null;
    trendStartRef.current=null;
    previewTrendRef.current=null;
    rangeRef.current={start:0,end:0};
    loadingRef.current=true;
    requestDraw();

    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${intervals[interval]}&limit=500`,{cache:"no-store"})
      .then(r=>r.json())
      .then(rows=>{
        if(!alive||!Array.isArray(rows))return;
        const next=rows.map((r:any)=>({
          time:+r[0],
          open:+r[1],
          high:+r[2],
          low:+r[3],
          close:+r[4],
          volume:+r[5]
        })) as Candle[];
        candlesRef.current=next;
        const end=next.length;
        rangeRef.current={start:Math.max(0,end-100),end};
        loadingRef.current=false;
        requestDraw();
      })
      .catch(()=>{loadingRef.current=false;requestDraw()});

    try{
      socket=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${intervals[interval]}`);
      socket.onmessage=e=>{
        try{
          const k=JSON.parse(e.data)?.k;
          if(!k||!alive)return;
          const next:Candle={
            time:+k.t,
            open:+k.o,
            high:+k.h,
            low:+k.l,
            close:+k.c,
            volume:+k.v
          };
          const current=candlesRef.current;
          const a=current.length?current.slice():[];
          const i=a.findIndex(x=>x.time===next.time);
          if(i>=0)a[i]=next;else a.push(next);
          const trimmed=a.slice(-500);
          candlesRef.current=trimmed;

          const prev=rangeRef.current;
          const following=prev.end>=current.length-1;
          if(following){
            const end=trimmed.length;
            const count=clamp(end-Math.max(0,prev.start),MIN_VISIBLE,MAX_VISIBLE);
            rangeRef.current={start:Math.max(0,end-count),end};
          }else{
            const span=Math.max(MIN_VISIBLE,Math.min(MAX_VISIBLE,prev.end-prev.start));
            const start=clamp(prev.start,0,Math.max(0,trimmed.length-span));
            rangeRef.current={start,end:Math.min(trimmed.length,start+span)};
          }
          requestDraw();
        }catch{}
      };
    }catch{}

    return()=>{alive=false;socket?.close()};
  },[symbol,interval,requestDraw]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    canvas.addEventListener("wheel",onWheel,{passive:false});
    const ro=new ResizeObserver(()=>requestDraw());
    if(wrapRef.current)ro.observe(wrapRef.current);
    return()=>{
      canvas.removeEventListener("wheel",onWheel);
      ro.disconnect();
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
    };
  },[requestDraw]);

  function clearDrawings(){
    trendsRef.current=[];
    horizontalRef.current=[];
    trendStartRef.current=null;
    previewTrendRef.current=null;
    requestDraw();
  }

  function resetView(){
    const end=candlesRef.current.length;
    rangeRef.current={start:Math.max(0,end-Math.min(100,end)),end};
    setAutoScale(true);
    requestDraw();
  }

  function zoom(delta:number){
    const total=candlesRef.current.length;
    if(total<2)return;
    const prev=rangeRef.current;
    const old=Math.max(MIN_VISIBLE,prev.end-prev.start);
    const next=clamp(old+delta,MIN_VISIBLE,Math.min(MAX_VISIBLE,total));
    const center=(prev.start+prev.end)/2;
    const start=clamp(Math.round(center-next/2),0,Math.max(0,total-next));
    rangeRef.current={start,end:start+next};
    requestDraw();
  }

  function onWheel(e:WheelEvent){
    e.preventDefault();
    const total=candlesRef.current.length;
    if(total<2)return;
    const canvas=canvasRef.current;
    if(!canvas)return;
    const r=canvas.getBoundingClientRect();
    const left=18,right=102,plotW=Math.max(30,r.width-left-right);
    const mouseRatio=clamp((e.clientX-r.left-left)/plotW,0,1);
    const prev=rangeRef.current;
    const old=prev.end-prev.start;
    const factor=e.deltaY<0?.82:1.22;
    const next=clamp(Math.round(old*factor),MIN_VISIBLE,Math.min(MAX_VISIBLE,total));
    const anchor=prev.start+Math.round(old*mouseRatio);
    const start=clamp(anchor-Math.round(next*mouseRatio),0,Math.max(0,total-next));
    rangeRef.current={start,end:Math.min(total,start+next)};
    requestDraw();
  }

  function pointFromEvent(e:React.PointerEvent<HTMLCanvasElement>):DrawingPoint{
    const canvas=e.currentTarget;
    const r=canvas.getBoundingClientRect();
    const dims=getChartGeometry(r.width,r.height,showVolume);
    const pX=e.clientX-r.left;
    const pY=clamp(e.clientY-r.top,dims.top,dims.top+dims.chartH);
    const range=rangeRef.current;
    const visibleCount=Math.max(1,range.end-range.start);
    const step=dims.plotW/visibleCount;
    const index=clamp(Math.floor((pX-dims.left)/step),0,visibleCount-1)+range.start;
    const visible=candlesRef.current.slice(range.start,range.end);
    if(!visible.length)return{index:range.start,price:0};
    const hi=Math.max(...visible.map(c=>c.high)),lo=Math.min(...visible.map(c=>c.low));
    const pad=(hi-lo)||Math.max(hi*.001,1e-8);
    const max=hi+pad*.06;
    const min=Math.max(0,lo-pad*.06);
    const price=max-((pY-dims.top)/dims.chartH)*(max-min);
    return{index,price};
  }

  function pointerMove(e:React.PointerEvent<HTMLCanvasElement>){
    const canvas=e.currentTarget;
    const r=canvas.getBoundingClientRect();
    const p={x:e.clientX-r.left,y:e.clientY-r.top};

    if(panRef.current){
      const dims=getChartGeometry(r.width,r.height,showVolume);
      const visibleCount=Math.max(1,rangeRef.current.end-rangeRef.current.start);
      const step=dims.plotW/visibleCount;
      const delta=Math.round((e.clientX-panRef.current.x)/Math.max(1,step));
      const span=panRef.current.end-panRef.current.start;
      const start=clamp(panRef.current.start-delta,0,Math.max(0,candlesRef.current.length-span));
      rangeRef.current={start,end:start+span};
      requestDraw();
      return;
    }

    if(drawModeRef.current==="trend"&&trendStartRef.current){
      previewTrendRef.current={a:trendStartRef.current,b:pointFromEvent(e)};
      requestDraw();
      return;
    }

    if(drawModeRef.current==="crosshair"){
      const range=rangeRef.current;
      const dims=getChartGeometry(r.width,r.height,showVolume);
      const visibleCount=Math.max(1,range.end-range.start);
      const step=dims.plotW/visibleCount;
      const index=clamp(Math.floor((p.x-dims.left)/step),0,visibleCount-1);
      crosshairRef.current={x:p.x,y:p.y,index};
      requestDraw();
    }
  }

  function pointerDown(e:React.PointerEvent<HTMLCanvasElement>){
    const canvas=e.currentTarget;
    const mode=drawModeRef.current;
    if(mode==="trend"){
      const point=pointFromEvent(e);
      if(!trendStartRef.current){
        trendStartRef.current=point;
        previewTrendRef.current={a:point,b:point};
        canvas.setPointerCapture?.(e.pointerId);
      }else{
        trendsRef.current.push({a:trendStartRef.current,b:point});
        trendStartRef.current=null;
        previewTrendRef.current=null;
        setDrawMode("crosshair");
      }
      requestDraw();
      return;
    }
    if(mode==="horizontal"){
      horizontalRef.current.push(pointFromEvent(e).price);
      setDrawMode("crosshair");
      requestDraw();
      return;
    }
    if(e.shiftKey||e.button===1){
      panRef.current={x:e.clientX,start:rangeRef.current.start,end:rangeRef.current.end};
      canvas.setPointerCapture?.(e.pointerId);
      return;
    }
    const r=canvas.getBoundingClientRect();
    crosshairRef.current={x:e.clientX-r.left,y:e.clientY-r.top,index:0};
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
      <div className="chart-group chart-intervals" aria-label="Chart timeframe">
        {(Object.keys(intervals) as ChartInterval[]).map(x=>
          <button key={x} className={interval===x?"active":""} onClick={()=>setInterval(x)}>
            {x==="1h"?"1H":x==="4h"?"4H":x==="1d"?"1D":x==="1w"?"1W":x}
          </button>
        )}
      </div>
      <div className="chart-divider"/>
      <div className="chart-group chart-tools" aria-label="Chart tools">
        <button className={drawMode==="crosshair"?"tool-active":""} title="Cursor / Crosshair" onClick={()=>setDrawMode("crosshair")}>CROSS</button>
        <button className={drawMode==="trend"?"tool-active":""} title="Trend line — click two points" onClick={()=>setDrawMode("trend")}>TREND</button>
        <button className={drawMode==="horizontal"?"tool-active":""} title="Horizontal price line" onClick={()=>setDrawMode("horizontal")}>H-LINE</button>
        <button title="Clear drawings" onClick={clearDrawings}>CLR</button>
        <button title="Zoom in" onClick={()=>zoom(-15)}>+</button>
        <button title="Zoom out" onClick={()=>zoom(15)}>−</button>
        <button title="Reset view" onClick={resetView}>FIT</button>
        <button className={showMA?"tool-active":""} title="Toggle moving averages" onClick={()=>setShowMA(v=>!v)}>MA</button>
        <button className={showVolume?"tool-active":""} title="Toggle volume" onClick={()=>setShowVolume(v=>!v)}>VOL</button>
      </div>
      <div className="chart-readout"><strong>{pair}</strong><span>LIVE</span></div>
      <span className="chart-source">ORBITEX CHART</span>
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
      <div className="chart-help">Hover · Shift+drag to pan · Scroll to zoom · Trend + H-Line for analysis</div>
    </div>
  </div>;
}

function getChartGeometry(w:number,h:number,showVolume:boolean){
  const left=18,right=78,top=16,bottom=36;
  const volH=showVolume?Math.max(54,Math.min(82,h*.17)):0;
  const chartH=Math.max(120,h-top-bottom-volH);
  const plotW=Math.max(40,w-left-right);
  return{left,right,top,bottom,volH,chartH,plotW};
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
  previewTrend:TrendLine|null,
  loading:boolean
){
  const rect=wrap.getBoundingClientRect();
  const d=window.devicePixelRatio||1;
  const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
  const targetW=Math.floor(w*d),targetH=Math.floor(h*d);
  if(canvas.width!==targetW||canvas.height!==targetH){
    canvas.width=targetW;
    canvas.height=targetH;
    canvas.style.width=`${w}px`;
    canvas.style.height=`${h}px`;
  }
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  ctx.setTransform(d,0,0,d,0,0);
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle="#070b11";
  ctx.fillRect(0,0,w,h);

  const dims=getChartGeometry(w,h,showVolume);
  const start=clamp(range.start,0,candles.length);
  const end=clamp(range.end,start,candles.length);
  const visible=candles.slice(start,end);

  if(loading||visible.length<2){
    ctx.fillStyle="#68778a";
    ctx.font="12px system-ui";
    ctx.textAlign="left";
    ctx.fillText("Loading market data…",20,32);
    return;
  }

  const hi=Math.max(...visible.map(c=>c.high));
  const lo=Math.min(...visible.map(c=>c.low));
  const rawSpan=Math.max(hi-lo,1e-12);
  const pad=rawSpan*(autoScale?.06:.045);
  const max=hi+pad,min=Math.max(0,lo-pad),span=Math.max(max-min,1e-12);
  const step=dims.plotW/visible.length;
  const bw=Math.max(2,Math.min(13,step*.64));
  const y=(price:number)=>dims.top+(max-price)/span*dims.chartH;
  const xAt=(i:number)=>dims.left+i*step+step/2;
  const priceAtY=(yy:number)=>max-((yy-dims.top)/dims.chartH)*span;

  ctx.strokeStyle="#17212d";
  ctx.lineWidth=1;
  for(let i=0;i<=6;i++){
    const gy=dims.top+dims.chartH*i/6;
    ctx.beginPath();ctx.moveTo(dims.left,gy+.5);ctx.lineTo(w-dims.right,gy+.5);ctx.stroke();
  }
  for(let i=0;i<=8;i++){
    const gx=dims.left+dims.plotW*i/8;
    ctx.beginPath();ctx.moveTo(gx+.5,dims.top);ctx.lineTo(gx+.5,dims.top+dims.chartH);ctx.stroke();
  }

  if(showVolume){
    const maxVol=Math.max(...visible.map(c=>c.volume))||1;
    visible.forEach((c,i)=>{
      const vh=(c.volume/maxVol)*(dims.volH-16);
      ctx.fillStyle=c.close>=c.open?"rgba(32,217,160,.25)":"rgba(239,77,104,.25)";
      ctx.fillRect(xAt(i)-Math.max(2,bw*.45),dims.top+dims.chartH+dims.volH-vh,bw,Math.max(1,vh));
    });
    ctx.fillStyle="#596a7e";
    ctx.font="9px system-ui";
    ctx.textAlign="left";
    ctx.fillText("VOL",dims.left,dims.top+dims.chartH+13);
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
    drawMA(ctx,candles,start,visible,20,xAt,y);
    drawMA(ctx,candles,start,visible,50,xAt,y,"#8f7cff");
  }

  const last=visible[visible.length-1];
  const currentY=y(last.close);
  ctx.strokeStyle=last.close>=last.open?"rgba(32,217,160,.7)":"rgba(239,77,104,.7)";
  ctx.setLineDash([5,5]);
  ctx.beginPath();ctx.moveTo(dims.left,currentY);ctx.lineTo(w-dims.right,currentY);ctx.stroke();
  ctx.setLineDash([]);
  drawPriceTag(ctx,w,dims.right,currentY,formatAxisPrice(last.close),last.close>=last.open);

  ctx.fillStyle="#718197";
  ctx.font="10px system-ui";
  ctx.textAlign="right";
  for(let i=0;i<=6;i++){
    const price=max-span*i/6;
    ctx.fillText(formatAxisPrice(price),w-10,dims.top+dims.chartH*i/6+4);
  }

  ctx.textAlign="center";
  for(let i=0;i<=6;i++){
    const idx=Math.min(visible.length-1,Math.floor((visible.length-1)*i/6));
    const date=new Date(visible[idx].time);
    const label=interval==="1d"||interval==="1w"
      ?date.toLocaleDateString(undefined,{month:"short",day:"numeric"})
      :date.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
    ctx.fillStyle="#637387";
    ctx.fillText(label,xAt(idx),h-10);
  }

  [...trends,...(previewTrend?[previewTrend]:[])].forEach(line=>{
    const ax=screenX(line.a.index,start,end,dims);
    const bx=screenX(line.b.index,start,end,dims);
    const ay=y(line.a.price),by=y(line.b.price);
    ctx.strokeStyle="#4da3ff";
    ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    drawHandle(ctx,ax,ay);drawHandle(ctx,bx,by);
  });

  horizontal.forEach(price=>{
    const yy=clamp(y(price),dims.top,dims.top+dims.chartH);
    ctx.strokeStyle="#4da3ff";
    ctx.lineWidth=1.2;
    ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(dims.left,yy);ctx.lineTo(w-dims.right,yy);ctx.stroke();
    ctx.setLineDash([]);
    drawPriceTag(ctx,w,dims.right,yy,formatAxisPrice(price),true,true);
  });

  if(crosshair&&crosshair.index>=0&&crosshair.index<visible.length){
    const c=visible[crosshair.index];
    const x=xAt(crosshair.index);
    const yy=clamp(crosshair.y,dims.top,dims.top+dims.chartH);
    ctx.strokeStyle="rgba(128,145,165,.75)";
    ctx.lineWidth=1;
    ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(x,dims.top);ctx.lineTo(x,dims.top+dims.chartH);ctx.moveTo(dims.left,yy);ctx.lineTo(w-dims.right,yy);ctx.stroke();
    ctx.setLineDash([]);

    drawPriceTag(ctx,w,dims.right,yy,formatAxisPrice(priceAtY(yy)),false,true);
    const timeLabel=interval==="1d"||interval==="1w"
      ?new Date(c.time).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})
      :new Date(c.time).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
    const boxW=268,boxH=62;
    const bx=clamp(x-boxW/2,dims.left,Math.max(dims.left,w-dims.right-boxW));
    const by=dims.top+8;
    ctx.fillStyle="rgba(7,11,17,.96)";
    ctx.fillRect(bx,by,boxW,boxH);
    ctx.strokeStyle="#2a3a4d";
    ctx.strokeRect(bx+.5,by+.5,boxW-1,boxH-1);
    ctx.textAlign="left";
    ctx.fillStyle="#dce5f0";
    ctx.font="600 11px system-ui";
    ctx.fillText(timeLabel,bx+10,by+17);
    ctx.fillStyle="#90a0b4";
    ctx.font="10px system-ui";
    ctx.fillText(`O ${formatAxisPrice(c.open)}   H ${formatAxisPrice(c.high)}   L ${formatAxisPrice(c.low)}   C ${formatAxisPrice(c.close)}`,bx+10,by+37);
    ctx.fillStyle="#596b7f";
    ctx.fillText(`VOL ${formatCompactVolume(c.volume)}`,bx+10,by+52);
  }
}

function screenX(index:number,start:number,end:number,dims:ReturnType<typeof getChartGeometry>){
  const visibleCount=Math.max(1,end-start);
  const step=dims.plotW/visibleCount;
  return dims.left+(index-start)*step+step/2;
}

function drawMA(
  ctx:CanvasRenderingContext2D,
  candles:Candle[],
  start:number,
  visible:Candle[],
  period:number,
  xAt:(i:number)=>number,
  y:(price:number)=>number,
  stroke="#f0c933"
){
  ctx.strokeStyle=stroke;
  ctx.lineWidth=1.5;
  ctx.beginPath();
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
  const tagW=secondary?70:Math.min(86,Math.max(70,label.length*7+16));
  const x=w-right+2;
  const cssH=ctx.canvas.height/(window.devicePixelRatio||1);
  const yy=clamp(y-h/2,4,cssH-h-4);
  ctx.fillStyle=secondary?"#1a2635":positive?"#1dd5a0":"#ef4d68";
  ctx.fillRect(x,yy,tagW,h);
  ctx.fillStyle=secondary?"#dce5f0":"#04100d";
  ctx.font=`600 ${secondary?9:10}px system-ui`;
  ctx.textAlign="center";
  ctx.fillText(label,x+tagW/2,yy+h/2+3);
}

function drawHandle(ctx:CanvasRenderingContext2D,x:number,y:number){
  ctx.fillStyle="#4da3ff";
  ctx.strokeStyle="#07111c";
  ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.stroke();
}

function formatCompactVolume(v:number){
  if(v>=1e9)return `${(v/1e9).toFixed(1)}B`;
  if(v>=1e6)return `${(v/1e6).toFixed(1)}M`;
  if(v>=1e3)return `${(v/1e3).toFixed(1)}K`;
  return v.toFixed(0);
}
