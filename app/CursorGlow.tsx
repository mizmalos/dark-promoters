'use client';

import { useEffect } from 'react';

// Cursor-reactive lighting for every .dark-input / .dark-select / .dark-textarea field.
// Two independent effects, both driven by one delegated pointermove listener + rAF loop:
//  - Border highlight: CSS custom properties on the field itself (see globals.css) —
//    stays constrained to the 1px border ring, brightest nearest the cursor.
//  - Atmospheric mist: a single shared floating element (.cursor-mist, created below),
//    NOT a child of any field, positioned in real viewport coordinates so it's free to
//    spill outside whichever field is active — a background can never do that on its own.
const SELECTOR = '.dark-input, .dark-select, .dark-textarea, .dark-card, .dark-card-2, .btn-primary, .btn-secondary';
const EASE = 0.14;
const EDGE_PEAK = 0.42;
const MIST_PEAK = 0.09;

export default function CursorGlow() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const mist = document.createElement('div');
    mist.className = 'cursor-mist';
    document.body.appendChild(mist);

    let activeEl: HTMLElement | null = null;
    let curMx = 50;
    let curMy = 50;
    let curPx = 0;
    let curPy = 0;
    let curA = 0;
    let targetA = 0;
    let px = 0;
    let py = 0;
    let rafId: number | null = null;

    function setEdge(el: HTMLElement, mx: number, my: number, a: number) {
      el.style.setProperty('--mx', `${mx}%`);
      el.style.setProperty('--my', `${my}%`);
      el.style.setProperty('--edge-a', String(a * EDGE_PEAK));
    }

    function setMist(x: number, y: number, a: number) {
      mist.style.transform = `translate3d(${x - 160}px, ${y - 160}px, 0)`;
      mist.style.opacity = String(a * MIST_PEAK);
    }

    function tick() {
      curPx += (px - curPx) * EASE;
      curPy += (py - curPy) * EASE;
      curA += (targetA - curA) * EASE;

      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        const rx = Math.max(0, Math.min(100, ((px - rect.left) / rect.width) * 100));
        const ry = Math.max(0, Math.min(100, ((py - rect.top) / rect.height) * 100));
        curMx += (rx - curMx) * EASE;
        curMy += (ry - curMy) * EASE;
        setEdge(activeEl, curMx, curMy, curA);
      }
      setMist(curPx, curPy, curA);

      if (targetA === 0 && curA < 0.003) {
        if (activeEl) setEdge(activeEl, curMx, curMy, 0);
        setMist(curPx, curPy, 0);
        activeEl = null;
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function onMove(e: PointerEvent) {
      px = e.clientX;
      py = e.clientY;
      const el = e.target instanceof Element ? (e.target.closest(SELECTOR) as HTMLElement | null) : null;

      if (el) {
        if (el !== activeEl) {
          if (activeEl) setEdge(activeEl, curMx, curMy, 0);
          activeEl = el;
          const rect = el.getBoundingClientRect();
          curMx = Math.max(0, Math.min(100, ((px - rect.left) / rect.width) * 100));
          curMy = Math.max(0, Math.min(100, ((py - rect.top) / rect.height) * 100));
        }
        targetA = 1;
      } else {
        targetA = 0;
      }

      if (rafId === null && (activeEl || curA > 0.001)) rafId = requestAnimationFrame(tick);
    }

    function onWindowLeave(e: MouseEvent) {
      if (!e.relatedTarget) targetA = 0;
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mouseout', onWindowLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mouseout', onWindowLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
      mist.remove();
    };
  }, []);

  return null;
}
