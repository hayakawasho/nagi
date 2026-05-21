import type { RefElement } from "../../types";
export type PendingMount = {
    readonly signal: AbortSignal;
    complete(): boolean;
    abort(): void;
};
export type PendingMounts = {
    add(el: RefElement): PendingMount;
    abort(el: RefElement): void;
};
export declare function createPendingMounts(): PendingMounts;
