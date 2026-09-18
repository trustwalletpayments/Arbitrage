"use client";

import { useEffect } from "react";

export default function OrbitexThemeInit() {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("orbitex-theme");
      document.documentElement.dataset.orbitexTheme = saved === "light" || saved === "system" ? saved : "dark";
    } catch {}
  }, []);

  return null;
}
