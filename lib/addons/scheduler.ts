import type { SchedulePriority, Scheduler } from "../types";

type NativeScheduler = {
  postTask(
    fn: () => void,
    opts?: { priority?: string; signal?: AbortSignal },
  ): Promise<void>;
};

// Prioritized Task Scheduling API (Chrome 94+) — not yet in TS lib.dom
const nativeScheduler = (
  globalThis as unknown as { scheduler?: NativeScheduler }
).scheduler;

function withAbort<T>(
  signal: AbortSignal | undefined,
  run: () => T,
  cancel: (handle: T) => void,
) {
  const handle = run();
  signal?.addEventListener("abort", () => cancel(handle), { once: true });
}

type CreateSchedulerOptions = {
  default?: SchedulePriority;
};

export function createScheduler(opts: CreateSchedulerOptions = {}): Scheduler {
  const defaultPriority: SchedulePriority = opts.default ?? "user-visible";

  return {
    schedule(fn, options = {}) {
      const priority = options.priority ?? defaultPriority;
      const { signal } = options;

      if (signal?.aborted) {
        return;
      }

      if (typeof nativeScheduler?.postTask === "function") {
        nativeScheduler.postTask(fn, { priority, signal }).catch(() => {});
        return;
      }

      switch (priority) {
        case "user-blocking":
          queueMicrotask(() => {
            if (!signal?.aborted) {
              fn();
            }
          });
          break;
        case "user-visible":
          withAbort(
            signal,
            () =>
              requestAnimationFrame(() => {
                if (!signal?.aborted) {
                  fn();
                }
              }),
            cancelAnimationFrame,
          );
          break;
        case "background":
          if (typeof requestIdleCallback === "function") {
            withAbort(
              signal,
              () =>
                requestIdleCallback(() => {
                  if (!signal?.aborted) {
                    fn();
                  }
                }),
              cancelIdleCallback,
            );
          } else {
            withAbort(
              signal,
              () =>
                setTimeout(() => {
                  if (!signal?.aborted) {
                    fn();
                  }
                }, 0),
              clearTimeout,
            );
          }
          break;
      }
    },
  };
}
