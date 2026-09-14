"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

const LOCK_CLASSES = ["no-scroll", "modal-open", "scroll-locked", "overflow-hidden"];

function restorePageScroll() {
  const html = document.documentElement;
  const body = document.body;

  LOCK_CLASSES.forEach((className) => {
    html.classList.remove(className);
    body.classList.remove(className);
  });

  html.classList.add("orbitex-scroll-enabled");
  body.classList.add("orbitex-scroll-enabled");

  [html, body].forEach((element) => {
    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("overflow-y", "auto", "important");
    element.style.setProperty("position", "static", "important");
    element.style.setProperty("height", "auto", "important");
    element.style.setProperty("min-height", "100%", "important");
    element.style.setProperty("touch-action", "auto", "important");
  });
}

export default function ScrollGuard() {
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    let timeout = 0;
    let observer: MutationObserver | null = null;

    const restore = () => {
      restorePageScroll();
      frame = window.requestAnimationFrame(() => restorePageScroll());
      timeout = window.setTimeout(() => restorePageScroll(), 150);
    };

    restore();
    window.addEventListener("pageshow", restore);
    window.addEventListener("popstate", restore);

    observer = new MutationObserver(() => {
      const html = document.documentElement;
      const body = document.body;
      const locked = LOCK_CLASSES.some((className) => html.classList.contains(className) || body.classList.contains(className));
      if (locked || html.style.overflow === "hidden" || body.style.overflow === "hidden") restorePageScroll();
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ["class", "style"]});
    observer.observe(document.body, {attributes: true, attributeFilter: ["class", "style"]});

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("popstate", restore);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
