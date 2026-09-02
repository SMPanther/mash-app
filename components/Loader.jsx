"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Plays once per browser session, not on every internal navigation —
// see 05-frontend-architecture.md "Key architectural decisions".
export default function Loader() {
  const [done, setDone] = useState(false);
  const [skip, setSkip] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("mash-loaded")) {
      setSkip(true);
      setDone(true);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDone(true);
      sessionStorage.setItem("mash-loaded", "1");
      return;
    }

    let start = null;
    let raf;
    function finish() {
      setDone(true);
      sessionStorage.setItem("mash-loaded", "1");
    }
    function tick(ts) {
      if (!start) start = ts;
      const progress = Math.min(100, ((ts - start) / 1300) * 100);
      if (barRef.current) barRef.current.style.width = progress + "%";
      if (progress < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(finish, 200);
      }
    }
    raf = requestAnimationFrame(tick);

    // Failsafe: requestAnimationFrame pauses while a tab/app is
    // backgrounded (common on mobile — switching apps mid-load, or the
    // browser throttling an inactive tab), which could otherwise leave
    // the loader stuck indefinitely since `tick` never gets to run again
    // until the tab is foregrounded. This guarantees it never blocks
    // longer than ~4s regardless of what requestAnimationFrame does.
    const failsafe = setTimeout(finish, 4000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, []);

  if (skip) return null;

  return (
    <div className="fixed inset-0 z-[900] pointer-events-none" aria-hidden={done}>
      <div
        className="absolute inset-0 bg-ink transition-transform duration-1000 ease-[cubic-bezier(.76,0,.24,1)]"
        style={{
          borderBottomLeftRadius: "52% 7vh",
          borderBottomRightRadius: "52% 7vh",
          transform: done ? "translateY(-115%)" : "translateY(0)",
          transitionDelay: done ? "0.36s" : "0s",
        }}
      />
      <div
        className="absolute inset-0 bg-ember transition-transform duration-1000 ease-[cubic-bezier(.76,0,.24,1)]"
        style={{
          borderBottomLeftRadius: "52% 7vh",
          borderBottomRightRadius: "52% 7vh",
          transform: done ? "translateY(-115%)" : "translateY(0)",
          transitionDelay: done ? "0.18s" : "0s",
        }}
      />
      <div
        className="absolute inset-0 bg-chili flex flex-col items-center justify-center text-paper transition-transform duration-1000 ease-[cubic-bezier(.76,0,.24,1)]"
        style={{
          borderBottomLeftRadius: "52% 7vh",
          borderBottomRightRadius: "52% 7vh",
          transform: done ? "translateY(-115%)" : "translateY(0)",
        }}
      >
        <Image
          src="/assets/logo/mash-logo-sticker.png"
          alt="MASH"
          width={200}
          height={100}
          priority
          className="w-[min(60vw,260px)] h-auto"
        />
        <div className="mt-6 font-display text-2xl tracking-wide">READY TO MASH!</div>
        <div className="mt-7 w-48 h-[3px] bg-paper/25 overflow-hidden">
          <div ref={barRef} className="h-full w-0 bg-paper" />
        </div>
      </div>
    </div>
  );
}
