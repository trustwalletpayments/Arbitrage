"use client";
import Link from "next/link";
import {Home,Repeat2,ChartCandlestick,WalletCards} from "lucide-react";
import "./mobile-nav.css";

export default function MobileNav(){
 return <nav className="mobile-nav">
  <Link href="/dashboard"><Home size={27} strokeWidth={2}/><span>Home</span></Link>
  <Link href="/trade"><Repeat2 size={27} strokeWidth={2}/><span>Trade</span></Link>
  <Link href="/futures"><ChartCandlestick size={27} strokeWidth={2}/><span>Futures</span></Link>
  <Link href="/wallet"><WalletCards size={27} strokeWidth={2}/><span>Assets</span></Link>
 </nav>
}
