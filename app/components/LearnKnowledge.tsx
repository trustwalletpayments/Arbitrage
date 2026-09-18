"use client";

import { useState } from "react";
import { ArrowDownToLine, BarChart3, PieChart, X, Check } from "lucide-react";

const lessons = [
  {
    category: "Getting started",
    read: "3 min read",
    title: "Your first crypto deposit",
    description: "Choose your asset, check the network and follow your transfer from wallet to exchange.",
    icon: "deposit",
    subtitle: "A network check makes all the difference.",
    steps: [
      ["Choose an asset", "Select the asset you want to deposit."],
      ["Match the network", "The sending and receiving networks must match. Check whether a memo or tag is required."],
      ["Review and send", "Verify the address and any minimum deposit. A small test transfer can help you check the route."],
      ["Follow confirmations", "Your deposit becomes available after the required network confirmations."],
    ],
  },
  {
    category: "Trading basics",
    read: "4 min read",
    title: "Market or limit order?",
    description: "Understand the difference between trading at the market and setting your own price.",
    icon: "chart",
    subtitle: "Two different ways to enter the market.",
    steps: [
      ["Market", "An order seeks execution at available prices. The final price may change with liquidity and market movement."],
      ["Limit", "You specify a price. An order can execute at that price or better, but may remain unfilled."],
      ["Review", "Check the asset, amount and estimated value. Consider fees and price movement before you confirm."],
    ],
  },
  {
    category: "Know your assets",
    read: "3 min read",
    title: "See the whole portfolio",
    description: "Follow your balances and allocation with a clearer view of where your assets sit.",
    icon: "portfolio",
    subtitle: "Balances are only part of the picture.",
    steps: [
      ["Balances", "Track what you hold in each account."],
      ["Allocation", "See the share of each asset in your portfolio."],
      ["Activity", "Review transfers, deposits and completed trades in context."],
    ],
  },
] as const;

function LessonIllustration({ type }: { type: string }) {
  if (type === "chart") return <div className="knowledge-illustration knowledge-chart"><div className="knowledge-box-top" /><div className="knowledge-box-front"><BarChart3 /></div></div>;
  if (type === "portfolio") return <div className="knowledge-illustration knowledge-portfolio"><div className="knowledge-box-top" /><div className="knowledge-box-front"><PieChart /></div></div>;
  return <div className="knowledge-illustration knowledge-deposit"><div className="knowledge-box-top" /><div className="knowledge-box-front"><ArrowDownToLine /></div></div>;
}

export default function LearnKnowledge() {
  const [open, setOpen] = useState<number | null>(null);
  return (
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
              <LessonIllustration type={lesson.icon} />
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
            <div className="knowledge-modal-icon"><BarChart3 /></div>
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
            <button className="knowledge-got-it" onClick={() => setOpen(null)}>Got it <Check /></button>
          </div>
        </div>
      )}
    </section>
  );
}
