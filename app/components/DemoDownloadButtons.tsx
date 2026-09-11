"use client";

import { useEffect } from "react";

export default function DemoDownloadButtons() {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(".reference-showcase .store-buttons");
    if (!host) return;

    host.innerHTML = `
      <div class="demo-download-grid">
        <a class="demo-download-card" href="/playstore-demo" aria-label="Open ORBITEX PlayStore demo">
          <svg class="demo-download-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#34A853" d="M2 3.5v17l9.5-8.5z"/>
            <path fill="#FBBC04" d="m2 3.5 12 7-2.5 2.5z"/>
            <path fill="#EA4335" d="m2 20.5 9.5-8.5 2.5 2.5z"/>
            <path fill="#4285F4" d="m11.5 12 2.5-2.5 4.2 2.45c.53.31.53 1.08 0 1.39L14 15.8z"/>
          </svg>
          <span><small>GET IT ON</small><b>PlayStore</b></span>
          <strong>›</strong>
        </a>
        <a class="demo-download-card" href="/apk-demo" aria-label="Download ORBITEX APK demo">
          <svg class="demo-download-icon apk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M4 17.5v2A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-2"/>
          </svg>
          <span><small>DOWNLOAD</small><b>APK</b></span>
          <strong>›</strong>
        </a>
      </div>`;
  }, []);

  return null;
}
