import type { ComponentSetup, RefElement } from "../types";

declare const mountOptionsBrand: unique symbol;

/** Options for `app.component(setup, opts)` — extended by mount addons. */
export interface MountOptions {
  readonly [mountOptionsBrand]?: never;
}

/** Mount after addon middleware runs — may return void when mount is deferred (e.g. scheduler). */
// biome-ignore lint/suspicious/noExplicitAny: return type varies with addons
export type MountFn = (el: RefElement, props: Record<string, any>) => any;

export type UnmountFn = (targets: RefElement[]) => void;

export type ComponentMiddleware = <S extends ComponentSetup>(comp: S) => S;

export type MountMiddleware = (
  next: MountFn,
  setup: ComponentSetup,
  opts: MountOptions,
) => MountFn;

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

/**
 * Identity helper for type inference only — no runtime effect.
 */
export function defineAddon(addon: Addon): Addon;
export function defineAddon<TOptions>(
  factory: (options?: TOptions) => Addon,
): (options?: TOptions) => Addon;
export function defineAddon(
  addonOrFactory: Addon | ((options?: unknown) => Addon),
): Addon | ((options?: unknown) => Addon) {
  return addonOrFactory;
}
