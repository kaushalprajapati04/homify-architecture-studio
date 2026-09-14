/**
 * Timing & Change Reporting Safety Guard
 *
 * Root Cause:
 * Chrome DevTools Live Metrics and web-vitals instrumentation evaluate a script
 * in the page context that defines `reportAllChanges`. During SPA soft navigations
 * or fast user interactions, the metric entries list can be empty (`entries: []`).
 * The reporter accesses `entries[0].startTime` without verifying that `entries[0]`
 * exists, throwing:
 *   "Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')"
 *
 * Resolution:
 * 1. Intercept `window.reportAllChanges` / `globalThis.reportAllChanges` so that any
 *    timing or change object passed into it is guaranteed to have a valid `startTime`
 *    and fallback timing entry `{ startTime: performance.now(), duration: 0 }`.
 * 2. Intercept unhandled `startTime` TypeErrors originating from `reportAllChanges`
 *    at the window error boundary, preventing browser console crashes while preserving
 *    all legitimate editor change-reporting functionality.
 */

export function initReportChangesGuard() {
  if (typeof window === 'undefined') return;

  let _reportAllChanges = window.reportAllChanges;

  const wrapReportFunction = (fn) => {
    if (typeof fn !== 'function') return fn;
    return function guardedReportAllChanges(changeOrMetric, ...args) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

      if (!changeOrMetric || typeof changeOrMetric !== 'object') {
        changeOrMetric = {
          startTime: now,
          entries: [{ startTime: now, duration: 0 }],
        };
      } else {
        if (changeOrMetric.startTime === undefined) {
          changeOrMetric.startTime = now;
        }
        if (!Array.isArray(changeOrMetric.entries)) {
          changeOrMetric.entries = [{ startTime: changeOrMetric.startTime, duration: 0 }];
        } else if (changeOrMetric.entries.length === 0) {
          changeOrMetric.entries = [{ startTime: changeOrMetric.startTime, duration: 0 }];
        } else if (changeOrMetric.entries[0] && changeOrMetric.entries[0].startTime === undefined) {
          changeOrMetric.entries[0].startTime = changeOrMetric.startTime;
        }
      }
      return fn.call(this, changeOrMetric, ...args);
    };
  };

  if (_reportAllChanges) {
    window.reportAllChanges = wrapReportFunction(_reportAllChanges);
  }

  try {
    Object.defineProperty(window, 'reportAllChanges', {
      configurable: true,
      enumerable: true,
      get() {
        return _reportAllChanges;
      },
      set(newFn) {
        _reportAllChanges = wrapReportFunction(newFn);
      },
    });
  } catch {
    window.reportAllChanges = wrapReportFunction(_reportAllChanges);
  }

  // Targeted error event listener for reportAllChanges startTime TypeError
  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || event.error?.message || '';
      const stack = event.error?.stack || '';

      const isStartTimeError = msg.includes("Cannot read properties of undefined (reading 'startTime')") ||
        msg.includes("reading 'startTime'");
      const isReportAllChanges = stack.includes('reportAllChanges') || msg.includes('reportAllChanges');

      if (isStartTimeError && isReportAllChanges) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initReportChangesGuard();
}
