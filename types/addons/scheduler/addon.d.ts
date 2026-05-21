import type { Cue, SchedulePriority } from "../../types";
declare module "../../core/addon" {
    interface MountOptions {
        priority?: SchedulePriority;
        when?: Cue;
    }
}
export declare function schedulerAddon(opts?: {
    priority?: SchedulePriority;
}): import("../../main").Addon;
