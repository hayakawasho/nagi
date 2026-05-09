import { scheduleTask } from "./task";

import type { SchedulePriority, Scheduler } from "../../types";

export function createScheduler(
  opts: { default?: SchedulePriority } = {},
): Scheduler {
  const defaultPriority: SchedulePriority = opts.default ?? "user-visible";

  return {
    schedule(task, options = {}) {
      scheduleTask(task, options.priority ?? defaultPriority, options.signal);
    },
  };
}
