import { type LifecycleErrorDetails } from "../error";
import type { ComponentContextImpl } from "./component";
type Phase = LifecycleErrorDetails["phase"];
export declare function errorReport(phase: Phase, target: ComponentContextImpl, cause: unknown, parent?: ComponentContextImpl | null): void;
export {};
