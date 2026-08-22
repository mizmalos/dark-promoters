'use client';

import { useEffect } from 'react';

// Cursor-reactive edge glow + mist for every .dark-input / .dark-select / .dark-textarea
// field, driven entirely through CSS custom properties (see globals.css). No DOM changes
// to individual fields — this mounts once and tracks whichever field the pointer is over.
const SELECTOR = '.dark-input, .dark-select, .dark-textarea';
const EASE = 0.18;

export default function CursorGlow() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let activeEl: HTMLElement | null = null;
    let curMx = 50;
    let curMy = 50;
    let curA = 0;
    let targetA = 0;
    let px = 0;
    let py = 0;
    let rafId: number | null = null;

    function setVars(el: HTMLElement, mx: number, my: number, a: number) {
      el.style.setProperty('--mx', `${mx}%`);
      el.style.setProperty('--my', `${my}%`);
      el.style.setProperty('--edge-a', String(a * 0.5));
      el.style.setProperty('--mist-a', String(a * 0.07));
    }

    function tick() {
      if (!activeEl) { rafId = null; return; }
      const rect = activeEl.getBoundingClientRect();
      const rx = Math.max(0, Math.min(100, ((px - rect.left) / rect.width) * 100));
      const ry = Math.max(0, Math.min(100, ((py - rect.top) / rect.height) * 100));

      curMx += (rx - curMx) * EASE;
      curMy += (ry - curMy) * EASE;
      curA += (targetA - curA) * EASE;
      setVars(activeEl, curMx, curMy, curA);

      if (targetA === 0 && curA < 0.003) {
        setVars(activeEl, curMx, curMy, 0);
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
          if (activeEl) setVars(activeEl, curMx, curMy, 0);
          activeEl = el;
          const rect = el.getBoundingClientRect();
          curMx = Math.max(0, Math.min(100, ((px - rect.left) / rect.width) * 100));
          curMy = Math.max(0, Math.min(100, ((py - rect.top) / rect.height) * 100));
          curA = 0;
        }
        targetA = 1;
      } else {
        targetA = 0;
      }

      if (rafId === null && activeEl) rafId = requestAnimationFrame(tick);
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
    };
  }, []);

  return null;
}
