import type { ComponentSetup } from "../../types";
import type { Addon, AddonContext, MountFn, MountOptions, UnmountFn } from "../addon";
type AddonRegistry = AddonContext & {
    composeComponent<S extends ComponentSetup>(setup: S): S;
    composeMount(mountFn: MountFn, setup: ComponentSetup, opts: MountOptions): MountFn;
    composeUnmount(unmountFn: UnmountFn): UnmountFn;
    install(addon: Addon): void;
};
declare function createAddonRegistry(): AddonRegistry;
export {};
