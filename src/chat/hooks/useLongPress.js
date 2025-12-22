import { useCallback, useRef } from "react";

const DEFAULT_MS = 350;

export function useLongPress(onLongPress, onClick, ms = DEFAULT_MS) {
  const timerRef = useRef(null);
  const targetRef = useRef(null);

  const start = useCallback(
    (event) => {
      targetRef.current = event.currentTarget;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onLongPress?.(event, targetRef.current);
      }, ms);
    },
    [onLongPress, ms],
  );

  const clear = useCallback(
    (event, shouldTriggerClick) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (shouldTriggerClick) onClick?.(event, targetRef.current);
      }
    },
    [onClick],
  );

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: (e) => clear(e, true),
    onMouseLeave: clear,
    onTouchEnd: (e) => clear(e, true),
  };
}
