import { LifecycleError, type LifecycleErrorDetails } from "../error";
import type { DebugEvent, DebugReporter } from "../debugEvent";
import type { ComponentContextImpl } from "./component";
declare function describeElement(element: Element): string;
export declare function dispatchDebugEvent(reporters: readonly DebugReporter[] | undefined, event: DebugEvent): void;
export declare function reportLifecycleError(phase: LifecycleErrorDetails["phase"], target: ComponentContextImpl, cause: unknown, parent?: ComponentContextImpl | null, extra?: Partial<LifecycleErrorDetails>): LifecycleError;
export declare function reportLifecycleInfo(phase: "mount" | "unmount", target: ComponentContextImpl): void;
export {};
