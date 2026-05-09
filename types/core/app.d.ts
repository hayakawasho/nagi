import type { ComponentSetup, RefElement, SchedulePriority, Scheduler } from "../types";
import type { ComponentContext } from "./component";
type AppOptions = {
    priority?: SchedulePriority;
};
type SyncApp = {
    component<S extends ComponentSetup>(wrap: S, opts?: AppOptions): (el: RefElement, props?: Record<string, any>) => ComponentContext<ReturnType<S["setup"]>>;
    unmount(targets: RefElement[]): void;
};
type AsyncApp = {
    component<S extends ComponentSetup>(wrap: S, opts?: AppOptions): (el: RefElement, props?: Record<string, any>) => void;
    unmount(targets: RefElement[]): void;
};
export declare function create(): SyncApp;
export declare function create(config: {
    scheduler?: undefined;
}): SyncApp;
export declare function create(config: {
    scheduler: Scheduler;
}): AsyncApp;
export declare function create(config: {
    scheduler?: Scheduler | undefined;
}): SyncApp | AsyncApp;
export {};
//# sourceMappingURL=app.d.ts.map