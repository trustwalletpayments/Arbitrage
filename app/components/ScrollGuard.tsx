"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LOCK_CLASSES = [
  "no-scroll",
  "modal-open",
  "scroll-locked",
  "overflow-hidden",
  "overflow-y-hidden",
];

function restorePageScroll() {
  const html = document.documentElement;
  const body = document.body;

  LOCK_CLASSES.forEach((className) => {
    html.classList.remove(className);
    body.classList.remove(className);
  });

  // Clear only scroll-lock styles. Do not force position/height, because that
  // can interfere with Next.js route transitions and the browser scroll root.
  [html, body].forEach((element) => {
    element.style.removeProperty("overflow");
    element.style.removeProperty("overflow-y");
    element.style.removeProperty("overflow-x");
    element.style.removeProperty("position");
    element.style.removeProperty("height");
    element.style.removeProperty("max-height");
    element.style.removeProperty("touch-action");
  });

  html.style.setProperty("overflow-y", "auto");
  body.style.setProperty("overflow-y", "auto");
}

export default function ScrollGuard() {
  const pathname = usePathname();

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;
    let timeout = 0;

    const restore = () => {
      restorePageScroll();
      firstFrame = window.requestAnimationFrame(() => {
        restorePageScroll();
        secondFrame = window.requestAnimationFrame(restorePageScroll);
      });
      timeout = window.setTimeout(restorePageScroll, 250);
    };

    restore();
    window.addEventListener("pageshow", restore);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", restore);
    };
  }, [pathname]);

  return null;
}
