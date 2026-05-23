import { isAbortError } from "./isAbortError";

import type { SchedulePriority } from "@usenagi/core";

type Scheduler = {
  schedule(
    task: () => void,
    options?: {
      priority?: SchedulePriority;
      signal?: AbortSignal;
    },
  ): void;
};

type NativeScheduler = {
  postTask(
    task: () => void,
    opts?: { priority?: SchedulePriority; signal?: AbortSignal },
  ): Promise<void>;
};

function scheduleTask(
  task: () => void,
  priority: SchedulePriority,
  signal?: AbortSignal,
) {
  if (signal?.aborted) {
    return;
  }

  const { scheduler: nativeScheduler } = globalThis as unknown as {
    scheduler?: NativeScheduler;
  };

  if (typeof nativeScheduler?.postTask === "function") {
    nativeScheduler.postTask(task, { priority, signal }).catch((reason) => {
      if (isAbortError(reason)) {
        return;
      }

      queueMicrotask(() => {
        throw reason;
      });
    });

    return;
  }

  schedulePolyfill(task, priority, signal);
}

function schedulePolyfill(
  task: () => void,
  priority: SchedulePriority,
  signal?: AbortSignal,
) {
  function runIfNotAborted() {
    if (!signal?.aborted) {
      task();
    }
  }

  function cancelOnAbort<T>(schedule: () => T, cancel: (handle: T) => void) {
    const handle = schedule();
    signal?.addEventListener("abort", () => cancel(handle), { once: true });
  }

  switch (priority) {
    case "user-blocking":
      queueMicrotask(runIfNotAborted);
      break;
    case "user-visible":
      cancelOnAbort(
        () => requestAnimationFrame(runIfNotAborted),
        cancelAnimationFrame,
      );
      break;
    case "background":
      if (typeof requestIdleCallback === "function") {
        cancelOnAbort(
          () => requestIdleCallback(runIfNotAborted),
          cancelIdleCallback,
        );
      } else {
        cancelOnAbort(() => setTimeout(runIfNotAborted, 0), clearTimeout);
      }
      break;
  }
}

function createScheduler(
  opts: { priority?: SchedulePriority } = {},
): Scheduler {
  const fallback: SchedulePriority = opts.priority ?? "user-visible";

  return {
    schedule(task, options = {}) {
      scheduleTask(task, options.priority ?? fallback, options.signal);
    },
  };
}

/** @internal */
export { createScheduler };
