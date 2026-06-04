import type { ComponentContext, ComponentSetup, ExposedSetup, RefElement } from "../types";
import type { Addon, MountOptions } from "./addon";
declare class App {
    #private;
    install: (...addons: Addon[]) => this;
    component: <S extends ComponentSetup>(rawComponent: S, opts?: MountOptions) => (el: RefElement, props?: Record<string, any>) => ComponentContext<ExposedSetup<ReturnType<S["setup"]>>> | void;
    unmount: (targets: RefElement[]) => Promise<void>;
}
export declare function create(): App;
export {};
