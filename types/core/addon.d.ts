import type { ComponentSetup, Cue, RefElement, SchedulePriority } from "../types";
/** Options for `app.component(setup, opts)` — used by mount addons (e.g. scheduler). */
export type MountOptions = {
    priority?: SchedulePriority;
    when?: Cue;
};
/** Mount after addon middleware runs — may return void when mount is deferred (e.g. scheduler). */
export type MountFn = (el: RefElement, props: Record<string, any>) => any;
export type UnmountFn = (targets: RefElement[]) => void;
export type ComponentMiddleware = <S extends ComponentSetup>(comp: S) => S;
export type MountMiddleware = (next: MountFn, setup: ComponentSetup, opts: MountOptions) => MountFn;
export type UnmountMiddleware = (next: UnmountFn) => UnmountFn;
export type Addon = {
    readonly name: string;
    install(ctx: AddonContext): void;
};
export type AddonContext = {
    readonly installedAddons: ReadonlySet<string>;
    addComponentMiddleware(middleware: ComponentMiddleware): void;
    addMountMiddleware(middleware: MountMiddleware): void;
    addUnmountMiddleware(middleware: UnmountMiddleware): void;
};
type AddonRegistry = AddonContext & {
    composeComponent<S extends ComponentSetup>(setup: S): S;
    composeMount(mountFn: MountFn, setup: ComponentSetup, opts: MountOptions): MountFn;
    composeUnmount(unmountFn: UnmountFn): UnmountFn;
    install(addon: Addon): void;
};
export declare function createAddonRegistry(): AddonRegistry;
/**
 * Identity helper for type inference only — no runtime effect.
 */
export declare function defineAddon(addon: Addon): Addon;
export declare function defineAddon<TOptions>(factory: (options?: TOptions) => Addon): (options?: TOptions) => Addon;
export {};
