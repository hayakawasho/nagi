import type { RefElement } from "../../types";
export type PendingMountTask = {
    readonly signal: AbortSignal;
    complete(): boolean;
    abort(): void;
};
export type PendingMountTasks = {
    add(el: RefElement): PendingMountTask;
    abort(el: RefElement): void;
};
export declare function createPendingMountTasks(): PendingMountTasks;
//# sourceMappingURL=pending.d.ts.map