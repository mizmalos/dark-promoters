'use client';

import { useEffect, useState } from 'react';

/**
 * Animated linear progress bar — renders empty, then fills green to
 * `percent` right after first paint so it visibly "loads in" on page load
 * (a CSS transition only animates on a style change, not on initial
 * render, hence the two-frame delay before setting the real width).
 */
export default function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setWidth(percent));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [percent]);

  return (
    <div className="mt-5">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${width}%` }} />
      </div>
      <p className="label-meta mt-2">{label}</p>
    </div>
  );
}
