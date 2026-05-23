import type { Cue, SchedulePriority } from "@usenagi/core";
declare module "@usenagi/core" {
    interface MountOptions {
        priority?: SchedulePriority;
        when?: Cue;
    }
}
export declare function schedulerAddon(opts?: {
    priority?: SchedulePriority;
}): import("@usenagi/core").Addon;
