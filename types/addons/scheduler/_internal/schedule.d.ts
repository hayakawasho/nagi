import type { SchedulePriority } from "../../../types";
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
