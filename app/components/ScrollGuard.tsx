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

  // Remove only temporary inline locks left by dialogs or previous routes.
  // Do not set overflow-y: auto here because it can fight route CSS and create
  // a stale scroll root after navigating between Spot, Futures, and Markets.
  [html, body].forEach((element) => {
    element.style.removeProperty("overflow");
    element.style.removeProperty("overflow-y");
    element.style.removeProperty("overflow-x");
    element.style.removeProperty("position");
    element.style.removeProperty("height");
    element.style.removeProperty("max-height");
    element.style.removeProperty("touch-action");
  });

  html.classList.remove("no-scroll", "modal-open", "scroll-locked");
  body.classList.remove("no-scroll", "modal-open", "scroll-locked");
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
