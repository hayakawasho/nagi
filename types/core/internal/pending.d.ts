import type { RefElement } from "../../types";
export type PendingTask = {
    readonly signal: AbortSignal;
    complete(): boolean;
    abort(): void;
};
export type PendingTasks = {
    add(el: RefElement): PendingTask;
    abort(el: RefElement): void;
};
export declare function createPendingTasks(): PendingTasks;
//# sourceMappingURL=pending.d.ts.map