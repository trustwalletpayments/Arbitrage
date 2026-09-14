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

  [html, body].forEach((element) => {
    element.style.removeProperty("overflow");
    element.style.removeProperty("overflow-y");
    element.style.removeProperty("position");
    element.style.removeProperty("height");
    element.style.removeProperty("touch-action");
  });

  html.style.setProperty("overflow-y", "auto");
  body.style.setProperty("overflow-y", "auto");
  body.style.setProperty("touch-action", "auto");
}

export default function ScrollGuard() {
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    let timeout = 0;

    const restore = () => {
      restorePageScroll();
      frame = window.requestAnimationFrame(() => restorePageScroll());
      timeout = window.setTimeout(() => restorePageScroll(), 120);
    };

    restore();
    window.addEventListener("pageshow", restore);
    window.addEventListener("popstate", restore);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("popstate", restore);
    };
  }, [pathname]);

  return null;
}
