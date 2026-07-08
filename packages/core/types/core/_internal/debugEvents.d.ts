import { LifecycleError, type LifecycleErrorDetails } from "../error";
import type { ComponentContextImpl } from "./component";
export declare function reportLifecycleError(phase: LifecycleErrorDetails["phase"], target: ComponentContextImpl, cause: unknown, parent?: ComponentContextImpl | null, extra?: Partial<LifecycleErrorDetails>): LifecycleError;
