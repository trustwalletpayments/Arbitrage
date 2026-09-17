"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountMoreMenu() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>(".more-button");
    if (!button) return;
    const updatePosition = () => {
      const rect = button.getBoundingClientRect();
      setPosition({ top: rect.bottom + 10, left: Math.max(12, rect.right - 230) });
    };
    const handleClick = () => {
      updatePosition();
      setOpen(value => !value);
    };
    button.addEventListener("click", handleClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      button.removeEventListener("click", handleClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  if (!open) return null;
  return (
    <>
      <button aria-label="Close menu" onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "transparent", border: 0, cursor: "default" }} />
      <div style={{ position: "fixed", top: position.top, left: position.left, width: 230, zIndex: 100, padding: 8, border: "1px solid #263b56", borderRadius: 14, background: "#0b1420", boxShadow: "0 18px 50px rgba(0,0,0,.45)" }}>
        <Link href="/referral" onClick={() => setOpen(false)} style={{ display: "block", padding: "13px 14px", borderRadius: 10, color: "#e8eef7", textDecoration: "none", fontSize: 14 }}>Referral Program</Link>
        <Link href="/airdrop" onClick={() => setOpen(false)} style={{ display: "block", padding: "13px 14px", borderRadius: 10, color: "#e8eef7", textDecoration: "none", fontSize: 14 }}>Airdrop Program</Link>
      </div>
    </>
  );
}
