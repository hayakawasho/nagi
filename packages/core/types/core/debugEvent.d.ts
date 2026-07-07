import type { RefElement } from "../types";
import type { LifecycleErrorDetails } from "./error";
export type DebugEventLevel = "error";
export type DebugEventSource = "lifecycle";
export type DebugEvent = {
    version: 1;
    level: "error";
    source: "lifecycle";
    phase: LifecycleErrorDetails["phase"];
    name: string;
    uid?: string;
    path?: string;
    parentUid?: string;
    element?: RefElement;
    elementLabel?: string;
    props?: unknown;
    cause: unknown;
};
export type DebugReporter = (event: DebugEvent) => void;
