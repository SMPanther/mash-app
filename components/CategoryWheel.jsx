"use client";

import { useEffect, useRef } from "react";

// A vertical "cylinder" of categories, built entirely from CSS 3D
// transforms (perspective + rotateX + translateZ) — no WebGL/Three.js,
// per the brief. Scrolling rotates it; whichever category lands in the
// center focus band becomes active and drives the panel next to it.
//
// The wheel event listener is attached directly to this component's own
// viewport element (not window/document), so scrolling only rotates the
// wheel while the pointer is actually over it — scroll anywhere else on
// the page behaves normally. That's what makes the three independent
// scroll zones (wheel / item panel / page) work without fighting
// each other.
export default function CategoryWheel({ categories, activeIndex, onActiveChange }) {
  const viewportRef = useRef(null);
  const cylinderRef = useRef(null);
  const itemRefs = useRef([]);
  const rotation = useRef({ current: 0, target: 0 });
  const rafId = useRef(null);
  const animating = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  const onActiveChangeRef = useRef(onActiveChange);

  const total = categories.length;
  const angleStep = 360 / total;
  const radius = 130; // translateZ distance — tuned for this component's height

  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  function updateVisuals() {
    const current = rotation.current.current;
    if (cylinderRef.current) {
      cylinderRef.current.style.transform = `rotateX(${current}deg)`;
    }

    let closestIndex = 0;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, index) => {
      if (!el) return;
      const itemAngle = index * angleStep;
      let totalAngle = (itemAngle - current) % 360;
      if (totalAngle > 180) totalAngle -= 360;
      if (totalAngle < -180) totalAngle += 360;

      const distance = Math.abs(totalAngle);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }

      // Depth hierarchy: closer to center = bigger, sharper, more opaque.
      // Tuned to feel subtle rather than arcade-like — see the brief's
      // "don't make the 3D effect cheesy" note.
      const normalizedDist = Math.min(distance / 90, 1);
      const scale = 1 - normalizedDist * 0.3;
      const opacity = 1 - normalizedDist * 0.75;
      const blur = normalizedDist * 3.5;
      const isActive = distance < angleStep / 2;

      el.style.transform = `rotateX(${-itemAngle}deg) translateZ(${radius}px) scale(${scale})`;
      el.style.opacity = opacity;
      el.style.filter = blur > 0.3 ? `blur(${blur}px)` : "none";
      const label = el.querySelector("[data-wheel-label]");
      if (label) label.style.color = isActive ? "var(--chili, #FF4B2B)" : "var(--char, #26201B)";
    });

    if (closestIndex !== activeIndexRef.current) {
      activeIndexRef.current = closestIndex;
      onActiveChangeRef.current(closestIndex);
    }
  }

  function animate() {
    const r = rotation.current;
    const diff = r.target - r.current;
    r.current += diff * 0.15;
    updateVisuals();
    if (Math.abs(diff) > 0.05) {
      rafId.current = requestAnimationFrame(animate);
    } else {
      r.current = r.target;
      updateVisuals();
      animating.current = false;
    }
  }

  function rotateTo(angle) {
    rotation.current.target = angle;
    if (!animating.current) {
      animating.current = true;
      rafId.current = requestAnimationFrame(animate);
    }
  }

  // Keep the wheel in sync if the active category changes from outside
  // (e.g. a ?category= deep link, or the mobile pill row).
  useEffect(() => {
    if (activeIndex === activeIndexRef.current) return;
    activeIndexRef.current = activeIndex;
    rotateTo(activeIndex * angleStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function handleWheel(e) {
      e.preventDefault();
      const sensitivity = 0.35;
      const nextTarget = rotation.current.target + e.deltaY * sensitivity;
      const nearestIndex = Math.round(nextTarget / angleStep);
      rotateTo(nearestIndex * angleStep);
    }

    // { passive: false } is what allows preventDefault() to actually stop
    // the page from scrolling underneath — the default JSX onWheel prop
    // works too, but attaching natively here keeps this scoped and
    // explicit about that requirement.
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    updateVisuals();

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleItemClick(index) {
    const currentTargetIndex = Math.round(rotation.current.target / angleStep);
    let indexDiff = (index - (((currentTargetIndex % total) + total) % total)) % total;
    if (indexDiff > total / 2) indexDiff -= total;
    if (indexDiff < -total / 2) indexDiff += total;
    rotateTo((currentTargetIndex + indexDiff) * angleStep);
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-full w-full overflow-hidden select-none"
      style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}
    >
      {/* Focus-zone: a soft highlighted pill behind the active category —
          MUST render behind the cylinder (lower z-index), not in front of
          it. This was inverted before and completely covered the active
          item with an opaque white box. */}
      <div
        className="absolute left-[2%] w-[96%] pointer-events-none z-0 rounded-2xl bg-white border border-chili/30"
        style={{ top: "50%", height: 80, transform: "translateY(-50%)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
      />
      {/* Top/bottom edge fade — items ease out of view instead of clipping abruptly */}
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20"
        style={{ background: "linear-gradient(to bottom, var(--paper, #F1ECE1), transparent)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
        style={{ background: "linear-gradient(to top, var(--paper, #F1ECE1), transparent)" }}
      />
      <div
        ref={cylinderRef}
        className="absolute inset-0 z-10"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {categories.map((cat, index) => (
          <button
            key={cat.slug}
            ref={(el) => (itemRefs.current[index] = el)}
            onClick={() => handleItemClick(index)}
            data-cursor-hover
            className="absolute left-0 top-1/2 w-full h-16 -mt-8 flex flex-col items-center justify-center gap-1"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cat.icon} alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" draggable={false} />
            <span data-wheel-label className="text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors duration-150">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
