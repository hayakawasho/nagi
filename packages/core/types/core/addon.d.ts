import type { ComponentMiddleware, MountMiddleware, UnmountMiddleware } from "./_internal/addonRegistry";
import type { DebugReporter } from "./debugEvent";
declare const mountOptionsBrand: unique symbol;
/** Options for `app.component(setup, opts)` — extended by mount addons. */
export interface MountOptions {
    readonly [mountOptionsBrand]?: never;
}
export type AddonContext = {
    readonly installedAddons: ReadonlySet<string>;
    addComponentMiddleware(middleware: ComponentMiddleware): void;
    addMountMiddleware(middleware: MountMiddleware): void;
    addUnmountMiddleware(middleware: UnmountMiddleware): void;
    addDebugReporter(reporter: DebugReporter): void;
};
export type Addon = {
    readonly name: string;
    install(ctx: AddonContext): void;
};
/**
 * Identity helper for type inference only — no runtime effect.
 */
export declare function defineAddon(addon: Addon): Addon;
export declare function defineAddon<TOptions>(factory: (options?: TOptions) => Addon): (options?: TOptions) => Addon;
export {};
