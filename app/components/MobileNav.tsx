"use client";
import Link from "next/link";
import {Home,LineChart,Repeat2,WalletCards,Menu} from "lucide-react";

export default function MobileNav(){
 return <nav className="mobile-nav">
  <Link href="/dashboard"><Home size={22}/><span>Home</span></Link>
  <Link href="/markets"><LineChart size={22}/><span>Markets</span></Link>
  <Link href="/trade"><Repeat2 size={22}/><span>Trade</span></Link>
  <Link href="/futures"><LineChart size={22}/><span>F&O</span></Link>
  <Link href="/wallet"><WalletCards size={22}/><span>Assets</span></Link>
  <Link href="/orders" className="mobile-menu"><Menu size={22}/><span>Menu</span></Link>
 </nav>
}
