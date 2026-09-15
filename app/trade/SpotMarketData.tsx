"use client";

import {useEffect,useState} from "react";
import "./spot-data.css";

type Props={symbol:string};
type Depth={bids:[string,string][];asks:[string,string][]};

function num(value:string|number){return Number(value||0)}
function price(value:number){return value?value.toLocaleString(undefined,{maximumFractionDigits:value<1?8:2}):"—"}
function amount(value:number){return value.toLocaleString(undefined,{maximumFractionDigits:6})}

export default function SpotMarketData({symbol}:Props){
  const [depth,setDepth]=useState<Depth>({bids:[],asks:[]});
  const [ticker,setTicker]=useState<any>(null);
  const [trades,setTrades]=useState<any[]>([]);
  const [error,setError]=useState("");
  useEffect(()=>{let alive=true;async function load(){try{const [d,t,r]=await Promise.all([fetch(`/api/market/spot?kind=depth&symbol=${symbol}`,{cache:"no-store"}),fetch(`/api/market/spot?kind=ticker&symbol=${symbol}`,{cache:"no-store"}),fetch(`/api/market/spot?kind=trades&symbol=${symbol}`,{cache:"no-store"})]);const [depthData,tickerData,tradesData]=await Promise.all([d.json(),t.json(),r.json()]);if(!alive)return;if(!d.ok||!t.ok||!r.ok)throw new Error("Market data unavailable");setDepth(depthData);setTicker(tickerData);setTrades(Array.isArray(tradesData)?tradesData:[]);setError("")}catch{if(alive)setError("Live market data is temporarily unavailable.")}}load();const timer=window.setInterval(load,3000);return()=>{alive=false;window.clearInterval(timer)}},[symbol]);
  const bids=depth.bids.slice(0,8),asks=depth.asks.slice(0,8),change=num(ticker?.priceChangePercent);
  return <div className="spot-data-stack"><div className="spot-stat-grid"><div><span>24H CHANGE</span><strong className={change<0?"negative":"positive"}>{change>=0?"+":""}{change.toFixed(2)}%</strong></div><div><span>24H HIGH</span><strong>{price(num(ticker?.highPrice))}</strong></div><div><span>24H LOW</span><strong>{price(num(ticker?.lowPrice))}</strong></div><div><span>24H VOLUME</span><strong>{amount(num(ticker?.quoteVolume))} USDT</strong></div><div><span>BEST BID</span><strong>{price(num(bids[0]?.[0]))}</strong></div><div><span>BEST ASK</span><strong>{price(num(asks[0]?.[0]))}</strong></div></div><div className="spot-market-panels"><section className="spot-market-card"><div className="spot-card-heading"><div><span>MARKET DEPTH</span><h3>Order book</h3></div><b>LIVE</b></div>{error?<p className="spot-empty">{error}</p>:<div className="spot-book"><div className="spot-book-head"><span>Price (USDT)</span><span>Amount</span></div><div className="spot-asks">{asks.slice().reverse().map((row,i)=><div key={`a${i}`}><span className="negative">{price(num(row[0]))}</span><span>{amount(num(row[1]))}</span></div>)}</div><div className="spot-mid-price">{price(num(ticker?.lastPrice))}<small>Last traded price</small></div><div className="spot-bids">{bids.map((row,i)=><div key={`b${i}`}><span className="positive">{price(num(row[0]))}</span><span>{amount(num(row[1]))}</span></div>)}</div></div>}</section><section className="spot-market-card"><div className="spot-card-heading"><div><span>MARKET ACTIVITY</span><h3>Recent trades</h3></div><b>LIVE</b></div>{error?<p className="spot-empty">{error}</p>:<div className="spot-book"><div className="spot-book-head"><span>Price (USDT)</span><span>Amount</span><span>Time</span></div>{trades.slice(0,12).map((trade,i)=><div className="spot-trade-row" key={trade.id||i}><span className={trade.isBuyerMaker?"negative":"positive"}>{price(num(trade.price))}</span><span>{amount(num(trade.qty))}</span><small>{new Date(num(trade.time)).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}</small></div>)}</div>}</section></div></div>;
}
