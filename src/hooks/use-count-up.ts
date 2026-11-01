import { useEffect, useRef, useState } from 'react';

/** Animates a number from its previous value to `target` with an ease-out curve (0 on first load). */
export function useCountUp(target: number, durationMs = 600) {
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    const from = current.current;
    const startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / durationMs);
      const value = Math.round(from + (target - from) * (1 - (1 - t) ** 3));
      current.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return shown;
}
