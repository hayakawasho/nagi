import type { Cue } from "../../types";

function abortError(): DOMException {
  return new DOMException("aborted", "AbortError");
}

function onAbort(
  signal: AbortSignal,
  cleanup: () => void,
  reject: (reason?: unknown) => void,
) {
  signal.addEventListener(
    "abort",
    () => {
      cleanup();
      reject(abortError());
    },
    { once: true },
  );
}

export function visible(opts?: IntersectionObserverInit): Cue {
  return (el, signal) => {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }

      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            resolve();
            return;
          }
        }
      }, opts);

      io.observe(el);

      onAbort(signal, () => io.disconnect(), reject);
    });
  };
}

export function idle(timeout?: number): Cue {
  return (_el, signal) => {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }

      if (typeof requestIdleCallback !== "function") {
        const id = setTimeout(() => resolve(), timeout ?? 0);
        onAbort(signal, () => clearTimeout(id), reject);
        return;
      }

      const id = requestIdleCallback(
        () => resolve(),
        timeout != null ? { timeout } : undefined,
      );

      onAbort(signal, () => cancelIdleCallback(id), reject);
    });
  };
}

export function media(query: string): Cue {
  return (_el, signal) => {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }

      const mql = matchMedia(query);

      if (mql.matches) {
        resolve();
        return;
      }

      const onChange = () => {
        if (mql.matches) {
          mql.removeEventListener("change", onChange);
          resolve();
        }
      };

      mql.addEventListener("change", onChange);

      onAbort(
        signal,
        () => mql.removeEventListener("change", onChange),
        reject,
      );
    });
  };
}

export function interaction(
  events: string[] = ["click", "focus", "pointerenter"],
): Cue {
  return (el, signal) => {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }

      const cleanup = () => {
        for (const evt of events) {
          el.removeEventListener(evt, onFire);
        }
      };

      const onFire = () => {
        cleanup();
        resolve();
      };

      for (const evt of events) {
        el.addEventListener(evt, onFire, { once: true });
      }

      onAbort(signal, cleanup, reject);
    });
  };
}
