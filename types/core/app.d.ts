import type { ComponentSetup, RefElement } from "../types";
import type { Addon, MountOptions } from "./addon";
import type { ComponentContext } from "./component";
type App = {
    install(...addons: Addon[]): App;
    component<S extends ComponentSetup>(component: S, opts?: MountOptions): (el: RefElement, props?: Record<string, any>) => ComponentContext<ReturnType<S["setup"]>> | void;
    unmount(targets: RefElement[]): void;
};
export declare function create(): App;
export {};
