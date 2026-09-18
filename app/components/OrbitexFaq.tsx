"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  ["What is ORBITEX?", "ORBITEX is a digital-asset trading platform designed to bring spot and futures markets, market data and wallet tools together in one account."],
  ["How do I create an ORBITEX account?", "Select Create account, complete the registration flow and sign in. Once your account is ready, you can access the available trading and wallet features."],
  ["How do I deposit crypto?", "Open your wallet, choose Deposit and select the supported asset and network. Always confirm the network and address before sending funds."],
  ["What can I trade on ORBITEX?", "ORBITEX supports a growing selection of digital-asset markets across spot and futures. Available pairs and products are shown in the Markets and trading interfaces."],
  ["How do spot and futures trading differ?", "Spot trading involves buying or selling an asset directly. Futures trading uses contracts whose value follows an underlying asset and can involve leverage and substantially higher risk."],
  ["What fees does ORBITEX charge?", "Trading and other applicable fees are displayed through the platform's fee information. Check the current fee schedule before placing an order."],
  ["How does ORBITEX protect my account?", "ORBITEX uses account controls, server-side checks and activity records as part of its security design. Keep your credentials private and enable available account protections."],
  ["Where can I get help?", "For account or platform questions, use the support options available on ORBITEX. You can also review the relevant guides and help resources before contacting support."],
] as const;

export default function OrbitexFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="orbitex-faq-section" id="faq" aria-labelledby="orbitex-faq-title">
      <div className="orbitex-faq-intro">
        <div className="orbitex-eyebrow">ORBITEX HELP</div>
        <h2 id="orbitex-faq-title">A few things<br /><span>worth knowing.</span></h2>
        <p>Quick answers to the questions traders ask most. Everything you need to get started with ORBITEX.</p>
        <a href="#faq-list" className="orbitex-faq-help">Visit the help center <span>→</span></a>
      </div>

      <div className="orbitex-faq-list" id="faq-list">
        {faqs.map(([question, answer], index) => {
          const isOpen = open === index;
          return (
            <div className={`orbitex-faq-item${isOpen ? " is-open" : ""}`} key={question}>
              <button
                type="button"
                className="orbitex-faq-question"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span>{question}</span>
                <span className="orbitex-faq-icon" aria-hidden="true">{isOpen ? "×" : "+"}</span>
              </button>
              <div className="orbitex-faq-answer" hidden={!isOpen}>
                <p>{answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
