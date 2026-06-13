import { LifecycleError, type LifecycleErrorDetails } from "../error";
import type { DebugReporter } from "../debugEvent";
import type { ComponentContextImpl } from "./component";
export declare function setDebugReporter(nextReporter: DebugReporter): void;
export declare function reportLifecycleError(phase: LifecycleErrorDetails["phase"], target: ComponentContextImpl, cause: unknown, parent?: ComponentContextImpl | null, extra?: Partial<LifecycleErrorDetails>): LifecycleError;
