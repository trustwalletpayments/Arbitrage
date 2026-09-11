"use client";
import Link from "next/link";
import {Home,Repeat2,ChartCandlestick,WalletCards} from "lucide-react";

export default function MobileNav(){
 return <nav className="mobile-nav">
  <Link href="/dashboard"><Home size={22}/><span>Home</span></Link>
  <Link href="/trade"><Repeat2 size={22}/><span>Trade</span></Link>
  <Link href="/futures"><ChartCandlestick size={22}/><span>Futures</span></Link>
  <Link href="/wallet"><WalletCards size={22}/><span>Assets</span></Link>
 </nav>
}
