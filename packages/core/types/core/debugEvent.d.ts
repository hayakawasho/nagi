import type { RefElement } from "../types";
import type { LifecycleErrorDetails } from "./error";
export type DebugEventLevel = "error" | "info";
export type DebugEventSource = "lifecycle" | "scheduler";
type DebugEventBase = {
    version: 1;
    name: string;
    uid?: string;
    path?: string;
    parentUid?: string;
    element?: RefElement;
    elementLabel?: string;
    props?: unknown;
};
export type DebugErrorEvent = DebugEventBase & {
    level: "error";
    source: "lifecycle";
    phase: LifecycleErrorDetails["phase"];
    cause: unknown;
};
export type DebugInfoEvent = DebugEventBase & ({
    level: "info";
} & ({
    source: "lifecycle";
    phase: "mount" | "unmount";
} | {
    source: "scheduler";
    phase: "pending" | "resolved" | "aborted";
    cueLabel?: string;
}));
export type DebugEvent = DebugErrorEvent | DebugInfoEvent;
export type DebugReporter = (event: DebugEvent) => void;
export {};
