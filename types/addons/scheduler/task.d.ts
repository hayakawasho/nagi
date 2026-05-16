import type { SchedulePriority } from "../../types";
export declare function scheduleTask(task: () => void, priority: SchedulePriority, signal?: AbortSignal): void;
