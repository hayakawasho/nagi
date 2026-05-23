import type { SchedulePriority } from "@usenagi/core";
type Scheduler = {
    schedule(task: () => void, options?: {
        priority?: SchedulePriority;
        signal?: AbortSignal;
    }): void;
};
declare function createScheduler(opts?: {
    priority?: SchedulePriority;
}): Scheduler;
export {};
