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

  [html, body].forEach((element) => {
    element.removeAttribute("data-scroll-locked");
    element.style.removeProperty("position");
    element.style.removeProperty("height");
    element.style.removeProperty("max-height");
    element.style.removeProperty("touch-action");
    element.style.setProperty("overflow-y", "auto", "important");
    element.style.setProperty("overflow-x", "hidden", "important");
  });
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
      timeout = window.setTimeout(restorePageScroll, 350);
    };

    restore();
    window.addEventListener("pageshow", restore);
    window.addEventListener("popstate", restore);

    // The Spot chart owns wheel gestures. Use a non-passive listener so the
    // browser cannot bubble the gesture to the page and scroll the document.
    const stopChartWheel = (event: WheelEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".custom-chart-canvas-wrap, .custom-chart-canvas-wrap canvas")) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("wheel", stopChartWheel, { passive: false, capture: true });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("popstate", restore);
      document.removeEventListener("wheel", stopChartWheel, { capture: true });
    };
  }, [pathname]);

  return null;
}
