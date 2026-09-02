"use client";

import { useEffect, useRef } from "react";

// Uses the real category stickers instead of emoji/generic icons — same
// chain-follow mechanic, now branded with the actual asset set.
const CHIPS = [
  { src: "/assets/category/burgers.png", size: 40 },
  { src: "/assets/category/ramen.png", size: 34 },
  { src: "/assets/category/pizzas.png", size: 28 },
  { src: "/assets/category/drinks.png", size: 22 },
];

const EASE = 0.28;

// Chain-follow cursor: each chip eases toward the one ahead of it, which is
// what produces both the trailing motion AND the settle-into-a-pile behavior
// when the mouse stops — see 01-project-study.md §6 for why that's one
// mechanic, not two.
export default function CustomCursor() {
  const layerRef = useRef(null);
  const pathRef = useRef(null);
  const chipRefs = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) return;

    const nodes = CHIPS.map(() => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }));
    let mouseX = nodes[0].x;
    let mouseY = nodes[0].y;

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let raf;
    function loop() {
      nodes[0].x += (mouseX - nodes[0].x) * EASE;
      nodes[0].y += (mouseY - nodes[0].y) * EASE;
      for (let i = 1; i < nodes.length; i++) {
        nodes[i].x += (nodes[i - 1].x - nodes[i].x) * EASE;
        nodes[i].y += (nodes[i - 1].y - nodes[i].y) * EASE;
      }
      nodes.forEach((n, i) => {
        const el = chipRefs.current[i];
        if (el) el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0) translate(-50%, -50%)`;
      });
      let d = `M ${nodes[0].x} ${nodes[0].y}`;
      for (let j = 1; j < nodes.length; j++) {
        const midX = (nodes[j - 1].x + nodes[j].x) / 2;
        const midY = (nodes[j - 1].y + nodes[j].y) / 2;
        d += ` Q ${nodes[j - 1].x} ${nodes[j - 1].y} ${midX} ${midY}`;
      }
      if (pathRef.current) pathRef.current.setAttribute("d", d);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    // Event delegation on document, not per-element listeners — this is
    // what makes hover state work on elements that don't exist yet at
    // mount time (the category wheel's buttons, menu cards that load
    // after a Supabase fetch). A querySelectorAll-at-mount approach can
    // only ever see what's already in the DOM the moment it runs.
    function onOver(e) {
      if (e.target.closest("a, button, [data-cursor-hover]")) {
        document.body.classList.add("cursor-hover");
      }
    }
    function onOut(e) {
      if (e.target.closest("a, button, [data-cursor-hover]")) {
        document.body.classList.remove("cursor-hover");
      }
    }
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={layerRef} className="fixed inset-0 pointer-events-none z-[2000] hidden md:block">
      <svg className="fixed inset-0 w-full h-full overflow-visible">
        <path ref={pathRef} fill="none" stroke="var(--paper, #F1ECE1)" strokeWidth="2" opacity="0.9" />
      </svg>
      {CHIPS.map((chip, i) => (
        <div
          key={i}
          ref={(el) => (chipRefs.current[i] = el)}
          className="fixed top-0 left-0 rounded-full bg-paper shadow-md overflow-hidden cursor-chip transition-transform duration-150"
          style={{ width: chip.size, height: chip.size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chip.src} alt="" className="w-full h-full object-contain p-0.5" draggable={false} />
        </div>
      ))}
    </div>
  );
}
