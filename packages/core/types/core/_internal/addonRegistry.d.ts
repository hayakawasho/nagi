import type { ComponentSetup, RefElement } from "../../types";
import type { Addon, AddonContext, MountOptions } from "../addon";
type MountFn = (el: RefElement, props: Record<string, any>) => any;
type UnmountFn = (targets: RefElement[]) => void;
export type ComponentMiddleware = <S extends ComponentSetup>(comp: S) => S;
export type MountMiddleware = (next: MountFn, setup: ComponentSetup, opts: MountOptions) => MountFn;
export type UnmountMiddleware = (next: UnmountFn) => UnmountFn;
declare class AddonRegistry implements AddonContext {
    #private;
    get installedAddons(): ReadonlySet<string>;
    addComponentMiddleware(middleware: ComponentMiddleware): void;
    addMountMiddleware(middleware: MountMiddleware): void;
    addUnmountMiddleware(middleware: UnmountMiddleware): void;
    composeComponent<S extends ComponentSetup>(setup: S): S;
    composeMount(mountFn: MountFn, setup: ComponentSetup, opts: MountOptions): MountFn;
    composeUnmount(unmountFn: UnmountFn): UnmountFn;
    install: (addon: Addon) => void;
}
declare const createAddonRegistry: () => AddonRegistry;
export {};
