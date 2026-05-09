import type { RefElement } from "../types";
import type { ComponentContext } from "./component";
export type LifecycleErrorDetails = {
    phase: "setup" | "mount" | "unmount" | "removeChild";
    name: string;
    uid?: string;
    path?: string;
    parentName?: string;
    parentUid?: string;
    element?: RefElement;
    props?: unknown;
    cause: unknown;
};
export declare function traceComponentTree(context: ComponentContext): string;
export declare class LifecycleError extends Error {
    readonly details: LifecycleErrorDetails;
    constructor(details: LifecycleErrorDetails);
    static create(phase: LifecycleErrorDetails["phase"], target: ComponentContext, cause: unknown, parent?: ComponentContext | null | undefined, extra?: Partial<LifecycleErrorDetails>): LifecycleError;
}
export declare function isLifecycleError(error: unknown): error is LifecycleError;
//# sourceMappingURL=error.d.ts.map