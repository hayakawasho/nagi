import type { Cue } from "../../types";

function abortError(): DOMException {
  return new DOMException("aborted", "AbortError");
}

export function visible(opts?: IntersectionObserverInit): Cue {
  return (el, signal) =>
    new Promise<void>((resolve, reject) => {
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

      signal.addEventListener(
        "abort",
        () => {
          io.disconnect();
          reject(abortError());
        },
        { once: true },
      );
    });
}

export function idle(timeout?: number): Cue {
  return (_el, signal) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }

      if (typeof requestIdleCallback !== "function") {
        const id = setTimeout(() => resolve(), timeout ?? 0);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(id);
            reject(abortError());
          },
          { once: true },
        );
        return;
      }

      const id = requestIdleCallback(
        () => resolve(),
        timeout != null ? { timeout } : undefined,
      );

      signal.addEventListener(
        "abort",
        () => {
          cancelIdleCallback(id);
          reject(abortError());
        },
        { once: true },
      );
    });
}

export function media(query: string): Cue {
  return (_el, signal) =>
    new Promise<void>((resolve, reject) => {
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

      signal.addEventListener(
        "abort",
        () => {
          mql.removeEventListener("change", onChange);
          reject(abortError());
        },
        { once: true },
      );
    });
}

export function interaction(
  events: string[] = ["click", "focus", "pointerenter"],
): Cue {
  return (el, signal) =>
    new Promise<void>((resolve, reject) => {
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

      signal.addEventListener(
        "abort",
        () => {
          cleanup();
          reject(abortError());
        },
        { once: true },
      );
    });
}
