"use client";

import { useState } from "react";
import { WalletMinimal, ArrowDownToLine, CandlestickChart, ChartPie, X } from "lucide-react";

const lessons = [
  { category: "Getting started", read: "3 min read", title: "Your first crypto deposit", description: "Choose your asset, check the network and follow your transfer from wallet to exchange.", icon: "deposit", subtitle: "A network check makes all the difference.", steps: [["Choose an asset", "Select the asset you want to deposit."], ["Match the network", "The sending and receiving networks must match. Check whether a memo or tag is required."], ["Review and send", "Verify the address and any minimum deposit. A small test transfer can help you check the route."], ["Follow confirmations", "Your deposit becomes available after the required network confirmations."]] },
  { category: "Trading basics", read: "4 min read", title: "Market or limit order?", description: "Understand the difference between trading at the market and setting your own price.", icon: "chart", subtitle: "Two different ways to enter the market.", steps: [["Market", "An order seeks execution at available prices. The final price may change with liquidity and market movement."], ["Limit", "You specify a price. An order can execute at that price or better, but may remain unfilled."], ["Review", "Check the asset, amount and estimated value. Consider fees and price movement before you confirm."]] },
  { category: "Know your assets", read: "3 min read", title: "See the whole portfolio", description: "Follow your balances and allocation with a clearer view of where your assets sit.", icon: "portfolio", subtitle: "Balances are only part of the picture.", steps: [["Balances", "Track what you hold in each account."], ["Allocation", "See the share of each asset in your portfolio."], ["Activity", "Review transfers, deposits and completed trades in context."]] }
] as const;

function LessonIcon({ type, size = 34 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 1.9, 'aria-hidden': true as const };
  if (type === "chart") return <CandlestickChart {...props} />;
  if (type === "portfolio") return <ChartPie {...props} />;
  return <span className="deposit-icon"><WalletMinimal {...props} /><ArrowDownToLine className="deposit-arrow" size={15} strokeWidth={2.3} aria-hidden="true" /></span>;
}

export default function LearnKnowledge() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <section className="knowledge-section" id="learn">
        <div className="knowledge-heading">
          <div className="orbitex-eyebrow">LEARN ORBITEX</div>
          <h2>A little knowledge.<br />A more confident <span>next step.</span></h2>
          <p>Get comfortable with the essentials, from moving your first assets to understanding your first order.</p>
        </div>

        <div className="knowledge-grid">
          {lessons.map((lesson, index) => (
            <article className="knowledge-card" key={lesson.title}>
              <button className="knowledge-card-button" onClick={() => setOpen(index)} aria-label={`Open ${lesson.title}`}>
                <div className="knowledge-meta"><span>{lesson.category}</span><i>·</i><small>{lesson.read}</small></div>
                <h3>{lesson.title}</h3>
                <p>{lesson.description}</p>
                <span className="knowledge-read">Read guide <b>→</b></span>
              </button>
            </article>
          ))}
        </div>

        {open !== null && (
          <div className="knowledge-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
            <div className="knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-modal-title">
              <button className="knowledge-close" onClick={() => setOpen(null)} aria-label="Close"><X /></button>
              <div className="knowledge-modal-icon"><LessonIcon type={lessons[open].icon} size={24} /></div>
              <h3 id="knowledge-modal-title">{lessons[open].title}</h3>
              <p className="knowledge-modal-subtitle">{lessons[open].subtitle}</p>
              <div className="knowledge-steps">
                {lessons[open].steps.map(([title, text], i) => (
                  <div className="knowledge-step" key={title}>
                    <strong>{String(i + 1).padStart(2, "0")}</strong>
                    <div><b>{title}</b><p>{text}</p></div>
                  </div>
                ))}
              </div>
              <button className="knowledge-got-it" onClick={() => setOpen(null)}>Got it</button>
            </div>
          </div>
        )}
      </section>

      <style jsx global>{`
        *{box-sizing:border-box}
        .knowledge-section{width:100%;max-width:1160px;margin:0 auto;padding:46px 20px 52px;position:relative}
        .knowledge-heading{text-align:center;max-width:900px;margin:0 auto 22px}.knowledge-heading h2{font-size:44px;line-height:1.08;letter-spacing:-1.6px;margin:8px 0 12px}.knowledge-heading h2 span{color:#60a5fa}.knowledge-heading p{margin:0;color:#9ca8b8;font-size:15px;line-height:1.45}
        .knowledge-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}.knowledge-card{height:220px;background:#0b1420;border:1px solid #24405f;border-radius:14px;overflow:hidden;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;min-width:0}.knowledge-card:hover{transform:translateY(-3px);border-color:#3179c7;box-shadow:0 18px 45px rgba(0,0,0,.18)}
        .knowledge-card-button{width:100%;height:100%;padding:22px 20px;background:none;border:0;color:inherit;text-align:left;cursor:pointer;font:inherit;display:flex;flex-direction:column;align-items:flex-start}
        .knowledge-meta{display:flex;align-items:center;gap:7px;margin-bottom:10px;font-size:11px}.knowledge-meta span{color:#60a5fa}.knowledge-meta i{font-style:normal;color:#53657c}.knowledge-meta small{color:#8391a4}
        .knowledge-card h3{font-size:21px;line-height:1.18;margin:0 0 9px;letter-spacing:-.35px;color:#f5f8fc}.knowledge-card p{color:#a8b6c8;font-size:13px;line-height:1.45;margin:0;max-width:360px}.knowledge-read{display:block;color:#f1f5f9;font-size:12px;margin-top:auto;padding-top:10px;font-weight:600}.knowledge-read b{color:#60a5fa;margin-left:7px;font-size:16px;font-weight:400}
        .knowledge-modal-backdrop{position:fixed;inset:0;background:rgba(1,5,10,.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:12px;z-index:100;overflow:hidden}
        .knowledge-modal{width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 24px);background:#10151c;border:1px solid #263b54;border-radius:13px;padding:18px 22px 14px;box-shadow:0 30px 100px rgba(0,0,0,.55);position:relative;overflow:hidden}
        .knowledge-close{position:absolute;right:12px;top:12px;background:none;border:0;color:#aeb9c8;cursor:pointer;padding:4px}.knowledge-close svg{width:20px;height:20px}.knowledge-modal-icon{width:44px;height:44px;border-radius:11px;background:#122b49;border:1px solid #2860a0;display:grid;place-items:center;color:#60a5fa;margin-bottom:8px}
        .knowledge-modal h3{font-size:25px;line-height:1.12;letter-spacing:-.65px;margin:0 0 3px;color:#f5f8fc}.knowledge-modal-subtitle{color:#aeb9c8;font-size:12px;margin:0 0 8px;line-height:1.3}.knowledge-steps{display:flex;flex-direction:column;gap:0;border-top:1px solid #202c3a}.knowledge-step{display:grid;grid-template-columns:30px 1fr;gap:6px;padding:7px 0;border-bottom:1px solid #202c3a}.knowledge-step>strong{color:#60a5fa;font-size:11px}.knowledge-step b{font-size:12px;line-height:1.15;color:#f5f8fc}.knowledge-step p{color:#aeb9c8;line-height:1.22;margin:2px 0 0;font-size:10.5px}.knowledge-got-it{width:100%;height:38px;border:0;border-radius:7px;background:#2563eb;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px}
        @media(max-width:900px){.knowledge-section{padding:40px 16px 46px}.knowledge-heading h2{font-size:38px}.knowledge-grid{grid-template-columns:1fr;max-width:520px;margin:auto}.knowledge-card{height:210px}.knowledge-card-button{padding:20px 19px}.knowledge-modal{width:min(540px,calc(100vw - 20px));padding:16px 18px 12px}}
        @media(max-width:520px){.knowledge-heading h2{font-size:31px;letter-spacing:-1px}.knowledge-heading p{font-size:14px}.knowledge-card{height:200px}.knowledge-card-button{padding:18px 17px}.knowledge-card h3{font-size:19px}.knowledge-card p{font-size:13px}.knowledge-modal-backdrop{padding:8px}.knowledge-modal{width:calc(100vw - 16px);max-height:calc(100vh - 16px);padding:14px 14px 10px;border-radius:11px}.knowledge-modal-icon{width:40px;height:40px}.knowledge-modal h3{font-size:21px}.knowledge-modal-subtitle{font-size:11.5px;margin-bottom:7px}.knowledge-step{grid-template-columns:27px 1fr;padding:6px 0}.knowledge-step b{font-size:11.5px}.knowledge-step p{font-size:10px;line-height:1.2}.knowledge-got-it{height:36px;margin-top:7px;font-size:12.5px}}
      `}</style>
    </>
  );
}
