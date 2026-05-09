import { isAbortError } from "../../utils/isAbortError";

import type { SchedulePriority } from "../../types";

type NativeScheduler = {
  postTask(
    task: () => void,
    opts?: { priority?: SchedulePriority; signal?: AbortSignal },
  ): Promise<void>;
};

function runIfActive(task: () => void, signal?: AbortSignal) {
  if (!signal?.aborted) {
    task();
  }
}

function cancelOnAbort<T>(
  signal: AbortSignal | undefined,
  run: () => T,
  cancel: (handle: T) => void,
) {
  const handle = run();
  signal?.addEventListener("abort", () => cancel(handle), { once: true });
}

function tryScheduleNativeTask(
  task: () => void,
  priority: SchedulePriority,
  signal?: AbortSignal,
): boolean {
  const { scheduler } = globalThis as unknown as {
    scheduler?: NativeScheduler;
  };

  if (typeof scheduler?.postTask !== "function") {
    return false;
  }

  scheduler.postTask(task, { priority, signal }).catch((reason) => {
    if (isAbortError(reason)) {
      return;
    }

    queueMicrotask(() => {
      throw reason;
    });
  });

  return true;
}

function scheduleFallbackTask(
  task: () => void,
  priority: SchedulePriority,
  signal?: AbortSignal,
) {
  switch (priority) {
    case "user-blocking":
      queueMicrotask(() => runIfActive(task, signal));
      break;
    case "user-visible":
      cancelOnAbort(
        signal,
        () => requestAnimationFrame(() => runIfActive(task, signal)),
        cancelAnimationFrame,
      );
      break;
    case "background":
      if (typeof requestIdleCallback === "function") {
        cancelOnAbort(
          signal,
          () => requestIdleCallback(() => runIfActive(task, signal)),
          cancelIdleCallback,
        );
      } else {
        cancelOnAbort(
          signal,
          () => setTimeout(() => runIfActive(task, signal), 0),
          clearTimeout,
        );
      }
      break;
  }
}

export function scheduleTask(
  task: () => void,
  priority: SchedulePriority,
  signal?: AbortSignal,
) {
  if (signal?.aborted) {
    return;
  }

  if (tryScheduleNativeTask(task, priority, signal)) {
    return;
  }

  scheduleFallbackTask(task, priority, signal);
}
