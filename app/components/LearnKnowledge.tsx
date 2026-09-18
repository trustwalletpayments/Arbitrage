"use client";

import { useState } from "react";
import { WalletCards, ChartNoAxesCombined, ChartPie, X } from "lucide-react";

const lessons = [
  { category: "Getting started", read: "3 min read", title: "Your first crypto deposit", description: "Choose your asset, check the network and follow your transfer from wallet to exchange.", icon: "deposit", subtitle: "A network check makes all the difference.", steps: [["Choose an asset", "Select the asset you want to deposit."], ["Match the network", "The sending and receiving networks must match. Check whether a memo or tag is required."], ["Review and send", "Verify the address and any minimum deposit. A small test transfer can help you check the route."], ["Follow confirmations", "Your deposit becomes available after the required network confirmations."]] },
  { category: "Trading basics", read: "4 min read", title: "Market or limit order?", description: "Understand the difference between trading at the market and setting your own price.", icon: "chart", subtitle: "Two different ways to enter the market.", steps: [["Market", "An order seeks execution at available prices. The final price may change with liquidity and market movement."], ["Limit", "You specify a price. An order can execute at that price or better, but may remain unfilled."], ["Review", "Check the asset, amount and estimated value. Consider fees and price movement before you confirm."]] },
  { category: "Know your assets", read: "3 min read", title: "See the whole portfolio", description: "Follow your balances and allocation with a clearer view of where your assets sit.", icon: "portfolio", subtitle: "Balances are only part of the picture.", steps: [["Balances", "Track what you hold in each account."], ["Allocation", "See the share of each asset in your portfolio."], ["Activity", "Review transfers, deposits and completed trades in context."]] }
] as const;

function LessonIcon({ type, size = 42 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 1.8, 'aria-hidden': true as const };
  if (type === "chart") return <ChartNoAxesCombined {...props} />;
  if (type === "portfolio") return <ChartPie {...props} />;
  return <WalletCards {...props} />;
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
                <div className="knowledge-icon-wrap"><LessonIcon type={lesson.icon} /></div>
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
              <div className="knowledge-modal-icon"><LessonIcon type={lessons[open].icon} size={30} /></div>
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
        .knowledge-section{max-width:1280px;margin:0 auto;padding:112px 30px 120px;position:relative}
        .knowledge-heading{text-align:center;max-width:1000px;margin:0 auto 52px}.knowledge-heading h2{font-size:52px;line-height:1.12;letter-spacing:-2px;margin:12px 0 20px}.knowledge-heading h2 span{color:#60a5fa}.knowledge-heading p{margin:0;color:#9ca8b8;font-size:17px;line-height:1.7}
        .knowledge-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}.knowledge-card{background:#0b1420;border:1px solid #24405f;border-radius:16px;overflow:hidden;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;min-width:0}.knowledge-card:hover{transform:translateY(-3px);border-color:#3179c7;box-shadow:0 18px 45px rgba(0,0,0,.18)}
        .knowledge-card-button{width:100%;min-height:440px;padding:30px 32px 30px;background:none;border:0;color:inherit;text-align:left;cursor:pointer;font:inherit;display:flex;flex-direction:column;align-items:flex-start}
        .knowledge-icon-wrap{width:78px;height:78px;border-radius:18px;background:#102846;border:1px solid #24548c;display:flex;align-items:center;justify-content:center;color:#60a5fa;margin-bottom:30px;box-shadow:0 0 28px rgba(37,99,235,.12)}
        .knowledge-icon-wrap svg{filter:drop-shadow(0 0 9px rgba(96,165,250,.16))}
        .knowledge-meta{display:flex;align-items:center;gap:9px;margin-bottom:13px;font-size:13px}.knowledge-meta span{color:#60a5fa}.knowledge-meta i{font-style:normal;color:#53657c}.knowledge-meta small{color:#8391a4}
        .knowledge-card h3{font-size:25px;line-height:1.22;margin:0 0 14px;letter-spacing:-.5px;color:#f5f8fc}.knowledge-card p{color:#a8b6c8;font-size:15px;line-height:1.6;margin:0;max-width:450px}.knowledge-read{display:block;color:#f1f5f9;font-size:14px;margin-top:auto;padding-top:25px;font-weight:600}.knowledge-read b{color:#60a5fa;margin-left:10px;font-size:20px;font-weight:400}
        .knowledge-modal-backdrop{position:fixed;inset:0;background:rgba(1,5,10,.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:100}
        .knowledge-modal{width:min(700px,100%);background:#10151c;border:1px solid #263b54;border-radius:14px;padding:32px 38px 24px;box-shadow:0 30px 100px rgba(0,0,0,.55);position:relative}
        .knowledge-close{position:absolute;right:18px;top:18px;background:none;border:0;color:#aeb9c8;cursor:pointer;padding:4px}.knowledge-close svg{width:23px;height:23px}.knowledge-modal-icon{width:58px;height:58px;border-radius:13px;background:#122b49;border:1px solid #2860a0;display:grid;place-items:center;color:#60a5fa;margin-bottom:18px}
        .knowledge-modal h3{font-size:32px;letter-spacing:-1px;margin:0 0 7px;color:#f5f8fc}.knowledge-modal-subtitle{color:#aeb9c8;font-size:16px;margin:0 0 19px;line-height:1.45}.knowledge-steps{display:flex;flex-direction:column;gap:0;border-top:1px solid #202c3a}.knowledge-step{display:grid;grid-template-columns:42px 1fr;gap:8px;padding:16px 0;border-bottom:1px solid #202c3a}.knowledge-step>strong{color:#60a5fa;font-size:14px}.knowledge-step b{font-size:15px;color:#f5f8fc}.knowledge-step p{color:#aeb9c8;line-height:1.4;margin:3px 0 0;font-size:14px}.knowledge-got-it{width:100%;height:48px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:18px}
        @media(max-width:1100px){.knowledge-grid{gap:22px}.knowledge-card-button{padding:28px 26px}.knowledge-icon-wrap{margin-bottom:25px}.knowledge-card h3{font-size:23px}}
        @media(max-width:900px){.knowledge-section{padding:85px 20px}.knowledge-heading h2{font-size:40px}.knowledge-grid{grid-template-columns:1fr;max-width:560px;margin:auto}.knowledge-card-button{min-height:0}.knowledge-modal{padding:30px 26px 22px}}
        @media(max-width:520px){.knowledge-heading h2{font-size:32px;letter-spacing:-1px}.knowledge-heading p{font-size:15px}.knowledge-card-button{padding:26px 24px}.knowledge-icon-wrap{width:70px;height:70px;margin-bottom:23px}.knowledge-card h3{font-size:22px}.knowledge-card p{font-size:15px}.knowledge-modal{padding:28px 20px 18px}.knowledge-modal-icon{width:54px;height:54px}.knowledge-modal h3{font-size:26px}.knowledge-step{grid-template-columns:36px 1fr;padding:13px 0}}
      `}</style>
    </>
  );
}
