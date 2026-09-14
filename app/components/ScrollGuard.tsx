"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function ScrollGuard(){
  const pathname=usePathname();

  useEffect(()=>{
    const html=document.documentElement;
    const body=document.body;

    html.classList.remove("no-scroll","modal-open","scroll-locked");
    body.classList.remove("no-scroll","modal-open","scroll-locked");

    html.style.removeProperty("overflow");
    html.style.removeProperty("overflow-y");
    html.style.removeProperty("position");
    html.style.removeProperty("height");
    body.style.removeProperty("overflow");
    body.style.removeProperty("overflow-y");
    body.style.removeProperty("position");
    body.style.removeProperty("height");

    html.style.overflowY="auto";
    body.style.overflowY="auto";
    body.style.touchAction="auto";

    return()=>{
      html.style.removeProperty("overflow-y");
      body.style.removeProperty("overflow-y");
      body.style.removeProperty("touch-action");
    };
  },[pathname]);

  return null;
}
