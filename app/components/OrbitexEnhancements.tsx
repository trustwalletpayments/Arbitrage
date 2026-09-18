"use client";

import { useEffect } from "react";
import { addLearningSection } from "./orbitexLearning";

const faqs = [
  ["What is ORBITEX?", "ORBITEX is a digital-asset trading platform designed to bring spot and futures markets, market data and wallet tools together in one account."],
  ["How do I create an ORBITEX account?", "Select Create account, complete the registration flow and sign in. Once your account is ready, you can access the available trading and wallet features."],
  ["How do I deposit crypto?", "Open your wallet, choose Deposit and select the supported asset and network. Always confirm the network and address before sending funds."],
  ["What can I trade on ORBITEX?", "ORBITEX supports a growing selection of digital-asset markets across spot and futures. Available pairs and products are shown in the Markets and trading interfaces."],
  ["How do spot and futures trading differ?", "Spot trading involves buying or selling an asset directly. Futures trading uses contracts whose value follows an underlying asset and can involve leverage and substantially higher risk."],
  ["What fees does ORBITEX charge?", "Trading and other applicable fees are displayed through the platform's fee information. Check the current fee schedule before placing an order."],
  ["How does ORBITEX protect my account?", "ORBITEX uses account controls, server-side checks and activity records as part of its security design. Keep your credentials private and enable available account protections."],
  ["Where can I get help?", "For account or platform questions, use the support options available on ORBITEX. You can also review the relevant guides and help resources before contacting support."],
];

function addFaq() {
  const home = document.querySelector<HTMLElement>(".orbitex-home");
  const footer = document.querySelector<HTMLElement>(".premium-footer");
  if (!home || !footer || home.querySelector(".orbitex-faq-section")) return;

  const faq = document.createElement("section");
  faq.className = "orbitex-faq-section";
  faq.id = "faq";
  faq.setAttribute("aria-labelledby", "orbitex-faq-title");

  const intro = document.createElement("div");
  intro.className = "orbitex-faq-intro";
  intro.innerHTML = '<div class="orbitex-eyebrow">ORBITEX HELP</div><h2 id="orbitex-faq-title">A few things<br><span>worth knowing.</span></h2><p>Quick answers to the questions traders ask most. Everything you need to get started with ORBITEX.</p><a href="#faq-list" class="orbitex-faq-help">Visit the help center <span>→</span></a>';

  const list = document.createElement("div");
  list.className = "orbitex-faq-list";
  list.id = "faq-list";

  faqs.forEach(([question, answer]) => {
    const item = document.createElement("div");
    item.className = "orbitex-faq-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "orbitex-faq-question";
    button.innerHTML = '<span></span><span class="orbitex-faq-icon">+</span>';
    const label = button.querySelector("span");
    if (label) label.textContent = question;

    const answerBox = document.createElement("div");
    answerBox.className = "orbitex-faq-answer";
    const paragraph = document.createElement("p");
    paragraph.textContent = answer;
    answerBox.appendChild(paragraph);

    button.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      list.querySelectorAll(".orbitex-faq-item.is-open").forEach((openItem) => openItem.classList.remove("is-open"));
      if (!wasOpen) item.classList.add("is-open");
      list.querySelectorAll(".orbitex-faq-icon").forEach((icon) => {
        const parent = icon.closest(".orbitex-faq-item");
        icon.textContent = parent?.classList.contains("is-open") ? "×" : "+";
      });
    });

    item.append(button, answerBox);
    list.appendChild(item);
  });

  faq.append(intro, list);
  footer.parentNode?.insertBefore(faq, footer);
}

function enhanceStoreButtons() {
  const box = document.querySelector<HTMLElement>(".store-buttons");
  if (!box || box.dataset.enhanced === "1") return;
  box.dataset.enhanced = "1";
  box.innerHTML = "";

  const play = document.createElement("a");
  play.className = "store-download store-play";
  play.href = "/playstore-demo";
  play.setAttribute("aria-label", "Open ORBITEX PlayStore demo");
  play.innerHTML = '<span class="store-download-copy"><small>GET IT ON</small><b>PlayStore</b></span><span class="store-download-arrow">›</span>';

  const apk = document.createElement("a");
  apk.className = "store-download store-apk";
  apk.href = "/apk-demo";
  apk.setAttribute("aria-label", "Open ORBITEX APK demo");
  apk.innerHTML = '<span class="store-download-copy"><small>DOWNLOAD</small><b>APK</b></span><span class="store-download-arrow">›</span>';

  box.append(play, apk);
}

export default function OrbitexEnhancements() {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("orbitex-theme");
      document.documentElement.dataset.orbitexTheme = saved === "light" || saved === "system" ? saved : "dark";
    } catch {}

    const enhance = () => {
      document.querySelectorAll(".premium-footer .footer-group[open]").forEach((group) => group.removeAttribute("open"));
      addLearningSection();
      addFaq();
      enhanceStoreButtons();
    };

    enhance();
    const timer = window.setTimeout(enhance, 300);
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      document.body.style.overflow = "";
    };
  }, []);

  return null;
}
