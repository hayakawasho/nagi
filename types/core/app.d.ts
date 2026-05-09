import type { ComponentSetup, RefElement, SchedulePriority, Scheduler } from "../types";
export declare function create(config?: {
    scheduler?: Scheduler;
}): {
    component(wrap: ComponentSetup, { priority, }?: {
        priority?: SchedulePriority;
    }): (el: RefElement, props?: Record<string, any>) => import("./component").ComponentContext<any> | undefined;
    unmount(targets: RefElement[]): void;
};
//# sourceMappingURL=app.d.ts.map