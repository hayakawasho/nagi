import type { RefElement } from "@usenagi/core";
type DeferredMount = {
    readonly signal: AbortSignal;
    complete(): boolean;
    abort(): void;
};
declare class DeferredMounts {
    #private;
    add(el: RefElement): DeferredMount;
    abort: (el: RefElement) => void;
}
declare function createDeferredMounts(): DeferredMounts;
export {};
