import type { RefElement } from "@usenagi/core";
type PendingMounts = {
    add(el: RefElement): {
        readonly signal: AbortSignal;
        complete(): boolean;
        abort(): void;
    };
    abort(el: RefElement): void;
};
declare function createPendingMounts(): PendingMounts;
export {};
