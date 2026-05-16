import { scheduleTask } from "./task";

import type { SchedulePriority, Scheduler } from "../../types";

export function createScheduler(
  opts: { priority?: SchedulePriority } = {},
): Scheduler {
  const fallback: SchedulePriority = opts.priority ?? "user-visible";

  return {
    schedule(task, options = {}) {
      scheduleTask(task, options.priority ?? fallback, options.signal);
    },
  };
}
