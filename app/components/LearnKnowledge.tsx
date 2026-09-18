"use client";

import { useState } from "react";
import { ArrowDownToLine, BarChart3, PieChart, X } from "lucide-react";

const lessons = [
  { category: "Getting started", read: "3 min read", title: "Your first crypto deposit", description: "Choose your asset, check the network and follow your transfer from wallet to exchange.", icon: "deposit", subtitle: "A network check makes all the difference.", steps: [["Choose an asset", "Select the asset you want to deposit."], ["Match the network", "The sending and receiving networks must match. Check whether a memo or tag is required."], ["Review and send", "Verify the address and any minimum deposit. A small test transfer can help you check the route."], ["Follow confirmations", "Your deposit becomes available after the required network confirmations."]] },
  { category: "Trading basics", read: "4 min read", title: "Market or limit order?", description: "Understand the difference between trading at the market and setting your own price.", icon: "chart", subtitle: "Two different ways to enter the market.", steps: [["Market", "An order seeks execution at available prices. The final price may change with liquidity and market movement."], ["Limit", "You specify a price. An order can execute at that price or better, but may remain unfilled."], ["Review", "Check the asset, amount and estimated value. Consider fees and price movement before you confirm."]] },
  { category: "Know your assets", read: "3 min read", title: "See the whole portfolio", description: "Follow your balances and allocation with a clearer view of where your assets sit.", icon: "portfolio", subtitle: "Balances are only part of the picture.", steps: [["Balances", "Track what you hold in each account."], ["Allocation", "See the share of each asset in your portfolio."], ["Activity", "Review transfers, deposits and completed trades in context."]] }
] as const;

function LessonIcon({ type, size = 42 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 1.8, 'aria-hidden': true as const };
  if (type === "chart") return <BarChart3 {...props} />;
  if (type === "portfolio") return <PieChart {...props} />;
  return <ArrowDownToLine {...props} />;
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
              <div className="knowledge-modal-icon"><LessonIcon type={lessons[open].icon} size={31} /></div>
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
        .knowledge-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:42px}.knowledge-card{background:#0b1420;border:1px solid #24405f;border-radius:18px;overflow:hidden;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;min-width:0}.knowledge-card:hover{transform:translateY(-3px);border-color:#3179c7;box-shadow:0 18px 45px rgba(0,0,0,.18)}
        .knowledge-card-button{width:100%;min-height:520px;padding:42px 46px 38px;background:none;border:0;color:inherit;text-align:left;cursor:pointer;font:inherit;display:flex;flex-direction:column;align-items:flex-start}
        .knowledge-icon-wrap{width:112px;height:112px;border-radius:22px;background:#102846;border:1px solid #24548c;display:flex;align-items:center;justify-content:center;color:#60a5fa;margin-bottom:42px;box-shadow:0 0 35px rgba(37,99,235,.12)}
        .knowledge-icon-wrap svg{filter:drop-shadow(0 0 10px rgba(96,165,250,.16))}
        .knowledge-meta{display:flex;align-items:center;gap:10px;margin-bottom:17px;font-size:14px}.knowledge-meta span{color:#60a5fa}.knowledge-meta i{font-style:normal;color:#53657c}.knowledge-meta small{color:#8391a4}
        .knowledge-card h3{font-size:29px;line-height:1.22;margin:0 0 18px;letter-spacing:-.7px;color:#f5f8fc}.knowledge-card p{color:#a8b6c8;font-size:17px;line-height:1.65;margin:0;max-width:450px}.knowledge-read{display:block;color:#f1f5f9;font-size:16px;margin-top:auto;padding-top:34px;font-weight:600}.knowledge-read b{color:#60a5fa;margin-left:12px;font-size:22px;font-weight:400}
        .knowledge-modal-backdrop{position:fixed;inset:0;background:rgba(1,5,10,.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;z-index:100}
        .knowledge-modal{width:min(820px,100%);max-height:calc(100vh - 48px);overflow:auto;background:#10151c;border:1px solid #263b54;border-radius:14px;padding:48px 48px 32px;box-shadow:0 30px 100px rgba(0,0,0,.55);position:relative}
        .knowledge-close{position:absolute;right:22px;top:22px;background:none;border:0;color:#aeb9c8;cursor:pointer;padding:4px}.knowledge-close svg{width:25px;height:25px}.knowledge-modal-icon{width:64px;height:64px;border-radius:13px;background:#122b49;border:1px solid #2860a0;display:grid;place-items:center;color:#60a5fa;margin-bottom:30px}
        .knowledge-modal h3{font-size:38px;letter-spacing:-1.2px;margin:0 0 10px;color:#f5f8fc}.knowledge-modal-subtitle{color:#aeb9c8;font-size:18px;margin:0 0 32px;line-height:1.55}.knowledge-steps{display:flex;flex-direction:column;gap:25px}.knowledge-step{display:grid;grid-template-columns:46px 1fr;gap:10px}.knowledge-step>strong{color:#60a5fa;font-size:16px}.knowledge-step b{font-size:17px;color:#f5f8fc}.knowledge-step p{color:#aeb9c8;line-height:1.55;margin:5px 0 0;font-size:16px}.knowledge-got-it{width:100%;height:58px;border:0;border-radius:9px;background:#2563eb;color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:30px}
        @media(max-width:1100px){.knowledge-grid{gap:24px}.knowledge-card-button{padding:34px 32px 32px}.knowledge-icon-wrap{margin-bottom:34px}.knowledge-card h3{font-size:25px}}
        @media(max-width:900px){.knowledge-section{padding:85px 20px}.knowledge-heading h2{font-size:40px}.knowledge-grid{grid-template-columns:1fr;max-width:560px;margin:auto}.knowledge-card-button{min-height:0}.knowledge-modal{padding:40px 28px 28px}.knowledge-modal h3{font-size:30px}}
        @media(max-width:520px){.knowledge-heading h2{font-size:32px;letter-spacing:-1px}.knowledge-heading p{font-size:15px}.knowledge-card-button{padding:30px 26px 28px}.knowledge-icon-wrap{width:96px;height:96px;margin-bottom:28px}.knowledge-card h3{font-size:24px}.knowledge-card p{font-size:15px}.knowledge-modal{padding:36px 22px 22px}.knowledge-modal-icon{width:58px;height:58px}.knowledge-modal h3{font-size:27px}}
      `}</style>
    </>
  );
}
