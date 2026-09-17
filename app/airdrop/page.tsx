import Link from "next/link";
import { Gift, ArrowLeft } from "lucide-react";
import "../program-page.css";

export default function AirdropPage() {
  return <main className="program-page"><div className="program-shell"><Link href="/dashboard" className="program-back"><ArrowLeft size={16} /> Back to dashboard</Link><div className="program-icon"><Gift size={28} /></div><div className="program-eyebrow">ORBITEX COMMUNITY</div><h1>Airdrop Program</h1><p className="program-lead">Community rewards and airdrop announcements will be published here.</p><section className="program-card"><div className="program-card-title"><Gift size={20} /><span>Airdrop status</span></div><p className="program-muted">The next airdrop campaign has not been announced yet. Check back for eligibility requirements, dates, and claim instructions.</p></section></div></main>;
}
