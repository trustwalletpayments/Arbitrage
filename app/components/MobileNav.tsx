"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Home,LineChart,Repeat2,ChartCandlestick,WalletCards} from "lucide-react";

export default function MobileNav(){
 const pathname=usePathname();
 const item=(href:string)=>(pathname===href||pathname.startsWith(`${href}/`))?"active":"";
 return <nav className="mobile-nav" aria-label="Primary navigation">
  <Link className={item("/dashboard")} href="/dashboard"><Home size={27} strokeWidth={2}/><span>Home</span></Link>
  <Link className={item("/markets")} href="/markets"><LineChart size={27} strokeWidth={2}/><span>Markets</span></Link>
  <Link className={item("/trade")} href="/trade"><Repeat2 size={27} strokeWidth={2}/><span>Trade</span></Link>
  <Link className={item("/futures")} href="/futures"><ChartCandlestick size={27} strokeWidth={2}/><span>F&amp;O</span></Link>
  <Link className={item("/wallet")} href="/wallet"><WalletCards size={27} strokeWidth={2}/><span>Assets</span></Link>
 </nav>
}
