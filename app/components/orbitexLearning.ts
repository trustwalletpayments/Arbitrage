type Guide = {
  category: string;
  read: string;
  title: string;
  description: string;
  intro: string;
  steps: [string, string][];
  icon: string;
};

const guides: Guide[] = [
  {
    category: "Getting started",
    read: "3 min read",
    title: "Your first crypto deposit",
    description: "Choose your asset, check the network and follow your transfer from wallet to exchange.",
    intro: "A network check makes all the difference.",
    steps: [
      ["Choose an asset", "Select the asset you want to deposit."],
      ["Match the network", "The sending and receiving networks must match. Check whether a memo or tag is required."],
      ["Review and send", "Verify the address and any minimum deposit. A small test transfer can help you check the route."],
      ["Follow confirmations", "Your deposit becomes available after the required network confirmations."],
    ],
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="8" y="14" width="32" height="25" rx="4" stroke="currentColor" stroke-width="2.6"/><path d="M13 14V11.5A4.5 4.5 0 0 1 17.5 7h17A4.5 4.5 0 0 1 39 11.5V14" stroke="currentColor" stroke-width="2.6"/><path d="M24 20v12M18.5 27l5.5 5 5.5-5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    category: "Trading basics",
    read: "4 min read",
    title: "Market or limit order?",
    description: "Understand the difference between trading at the market and setting your own price.",
    intro: "Two different ways to enter the market.",
    steps: [
      ["Market", "An order seeks execution at available prices. The final price may change with liquidity and market movement."],
      ["Limit", "You specify a price. An order can execute at that price or better, but may remain unfilled."],
      ["Review", "Check the asset, amount and estimated value. Consider fees and price movement before you confirm."],
    ],
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M9 36V12M9 36h30" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/><path d="M16 29V22M24 29V17M32 29V12" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg>'
  },
  {
    category: "Know your assets",
    read: "3 min read",
    title: "See the whole portfolio",
    description: "Follow your balances and allocation with a clearer view of where your assets sit.",
    intro: "Balances are only part of the picture. Review how your assets are distributed and distinguish deposited funds from changes in market value.",
    steps: [
      ["Balances", "Track what you hold in each account."],
      ["Allocation", "See the share of each asset in your portfolio."],
      ["Activity", "Review transfers, deposits and completed trades in context."],
    ],
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 7a17 17 0 1 0 17 17H24V7Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M28 7.5A17 17 0 0 1 40.5 20H28V7.5Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>'
  }
];

export function addLearningSection() {
  const home = document.querySelector<HTMLElement>(".orbitex-home");
  const footer = document.querySelector<HTMLElement>(".premium-footer");
  if (!home || !footer || home.querySelector(".orbitex-learning-section")) return;

  const section = document.createElement("section");
  section.className = "orbitex-learning-section";
  section.setAttribute("aria-labelledby", "orbitex-learning-title");

  const head = document.createElement("div");
  head.className = "orbitex-learning-head";
  const eyebrow = document.createElement("div");
  eyebrow.className = "orbitex-learning-eyebrow";
  eyebrow.textContent = "LEARN & GET STARTED";
  const title = document.createElement("h2");
  title.className = "orbitex-learning-title";
  title.id = "orbitex-learning-title";
  title.innerHTML = "A little knowledge.<br>A more confident <span>next step.</span>";
  const subtitle = document.createElement("p");
  subtitle.className = "orbitex-learning-subtitle";
  subtitle.textContent = "Get comfortable with the essentials, from moving your first assets to understanding your first order.";
  head.append(eyebrow, title, subtitle);

  const grid = document.createElement("div");
  grid.className = "orbitex-learning-grid";

  const modal = document.createElement("div");
  modal.className = "orbitex-learning-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");

  const dialog = document.createElement("div");
  dialog.className = "orbitex-learning-dialog";
  const close = document.createElement("button");
  close.className = "orbitex-learning-close";
  close.type = "button";
  close.setAttribute("aria-label", "Close guide");
  close.textContent = "×";
  const modalIcon = document.createElement("div");
  modalIcon.className = "orbitex-learning-modal-icon";
  const modalTitle = document.createElement("h3");
  const modalIntro = document.createElement("p");
  const steps = document.createElement("div");
  steps.className = "orbitex-learning-steps";
  const done = document.createElement("button");
  done.className = "orbitex-learning-modal-done";
  done.type = "button";
  done.textContent = "Got it  ✓";
  dialog.append(close, modalIcon, modalTitle, modalIntro, steps, done);
  modal.appendChild(dialog);

  const closeGuide = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const openGuide = (guide: Guide) => {
    modalIcon.innerHTML = guide.icon;
    modalTitle.textContent = guide.title;
    modalIntro.textContent = guide.intro;
    steps.innerHTML = "";
    guide.steps.forEach(([heading, text], index) => {
      const row = document.createElement("div");
      row.className = "orbitex-learning-step";
      const num = document.createElement("div");
      num.className = "orbitex-learning-step-num";
      num.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("div");
      const h4 = document.createElement("h4");
      h4.textContent = heading;
      const p = document.createElement("p");
      p.textContent = text;
      copy.append(h4, p);
      row.append(num, copy);
      steps.appendChild(row);
    });
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  close.addEventListener("click", closeGuide);
  done.addEventListener("click", closeGuide);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeGuide();
  });

  guides.forEach((guide) => {
    const card = document.createElement("article");
    card.className = "orbitex-learning-card";
    const icon = document.createElement("div");
    icon.className = "orbitex-learning-icon";
    icon.innerHTML = guide.icon;
    const meta = document.createElement("div");
    meta.className = "orbitex-learning-meta";
    const category = document.createElement("strong");
    category.textContent = guide.category;
    const dot = document.createElement("span");
    dot.className = "orbitex-learning-dot";
    dot.textContent = "·";
    const read = document.createElement("span");
    read.textContent = guide.read;
    meta.append(category, dot, read);
    const h3 = document.createElement("h3");
    h3.textContent = guide.title;
    const p = document.createElement("p");
    p.textContent = guide.description;
    const link = document.createElement("button");
    link.className = "orbitex-learning-guide";
    link.type = "button";
    link.innerHTML = "Read guide <span>→</span>";
    link.addEventListener("click", () => openGuide(guide));
    card.append(icon, meta, h3, p, link);
    grid.appendChild(card);
  });

  section.append(head, grid, modal);
  footer.parentNode?.insertBefore(section, footer);
}
