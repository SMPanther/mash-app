"use client";

import { useEffect, useRef } from "react";

// Uses the real category stickers instead of emoji/generic icons — same
// chain-follow mechanic, now branded with the actual asset set.
const CHIPS = [
  { src: "/assets/category/burgers.png", size: 38 },
  { src: "/assets/category/ramen.png", size: 30 },
  { src: "/assets/category/pizzas.png", size: 24 },
];

const EASE = 0.3;
// Hard cap on how far apart two consecutive chips are ever allowed to be.
// Without this, a fast mouse move leaves the trailing chips lagging far
// behind for several frames — the bezier curve that used to connect them
// would arc out through the empty space between two widely-separated
// points, rendering as a disconnected floating line with no chip anywhere
// near it (this is the exact bug visible in the reported video). Clamping
// the distance means the visible trail can never stretch further than
// this, no matter how fast the mouse moves.
const MAX_LINK_DISTANCE = 46;

// Chain-follow cursor: each chip eases toward the one ahead of it, which is
// what produces both the trailing motion AND the settle-into-a-pile behavior
// when the mouse stops — see 01-project-study.md §6 for why that's one
// mechanic, not two.
export default function CustomCursor() {
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
      // The leading node tracks the mouse EXACTLY, no easing — with the
      // system cursor hidden, this is the only thing telling you where a
      // click will actually land.
      nodes[0].x = mouseX;
      nodes[0].y = mouseY;

      for (let i = 1; i < nodes.length; i++) {
        nodes[i].x += (nodes[i - 1].x - nodes[i].x) * EASE;
        nodes[i].y += (nodes[i - 1].y - nodes[i].y) * EASE;

        // Clamp: never let this link stretch past MAX_LINK_DISTANCE.
        const dx = nodes[i].x - nodes[i - 1].x;
        const dy = nodes[i].y - nodes[i - 1].y;
        const dist = Math.hypot(dx, dy);
        if (dist > MAX_LINK_DISTANCE) {
          const ratio = MAX_LINK_DISTANCE / dist;
          nodes[i].x = nodes[i - 1].x + dx * ratio;
          nodes[i].y = nodes[i - 1].y + dy * ratio;
        }
      }

      nodes.forEach((n, i) => {
        const el = chipRefs.current[i];
        if (el) el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0) translate(-50%, -50%)`;
      });

      // Straight segments only, not a smoothed curve — a line between two
      // points can never wander outside the space between them, which is
      // what makes this immune to the floating-arc bug regardless of
      // speed. Combined with the distance clamp above, every segment is
      // both short and straight.
      let d = `M ${nodes[0].x} ${nodes[0].y}`;
      for (let j = 1; j < nodes.length; j++) {
        d += ` L ${nodes[j].x} ${nodes[j].y}`;
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
    <div className="fixed inset-0 pointer-events-none z-[2000] hidden md:block">
      <svg className="fixed inset-0 w-full h-full overflow-visible">
        <path ref={pathRef} fill="none" stroke="var(--char, #26201B)" strokeWidth="1.5" opacity="0.25" />
      </svg>
      {CHIPS.map((chip, i) => (
        <div
          key={i}
          ref={(el) => (chipRefs.current[i] = el)}
          className="fixed top-0 left-0 rounded-full bg-white border-2 border-chili/40 shadow-lg overflow-hidden cursor-chip transition-transform duration-150"
          style={{ width: chip.size, height: chip.size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={chip.src} alt="" className="w-full h-full object-contain p-0.5" draggable={false} />
        </div>
      ))}
    </div>
  );
}
