import type { SchedulePriority, Scheduler } from "../../types";
export declare function createScheduler(opts?: {
    priority?: SchedulePriority;
}): Scheduler;
