import type {
  ComponentSetup,
  RefElement,
} from "../types";

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

type AddonRegistry = AddonContext & {
  composeComponent<S extends ComponentSetup>(setup: S): S;
  composeMount(
    mountFn: MountFn,
    setup: ComponentSetup,
    opts: MountOptions,
  ): MountFn;
  composeUnmount(unmountFn: UnmountFn): UnmountFn;
  install(addon: Addon): void;
};

export function createAddonRegistry(): AddonRegistry {
  const installedAddons = new Set<string>();
  const componentMiddlewares: ComponentMiddleware[] = [];
  const mountMiddlewares: MountMiddleware[] = [];
  const unmountMiddlewares: UnmountMiddleware[] = [];

  const addonRegistry = {
    get installedAddons() {
      return installedAddons;
    },

    addComponentMiddleware(middleware) {
      componentMiddlewares.push(middleware);
    },

    addMountMiddleware(middleware) {
      mountMiddlewares.push(middleware);
    },

    addUnmountMiddleware(middleware) {
      unmountMiddlewares.push(middleware);
    },

    composeComponent(setup) {
      return componentMiddlewares.reduce(
        (s, middleware) => middleware(s),
        setup,
      );
    },

    composeMount(mountFn, setup, opts) {
      return mountMiddlewares.reduce(
        (mount, middleware) => middleware(mount, setup, opts),
        mountFn,
      );
    },

    composeUnmount(unmountFn) {
      return unmountMiddlewares.reduce(
        (unmount, middleware) => middleware(unmount),
        unmountFn,
      );
    },

    install(addon) {
      if (installedAddons.has(addon.name)) {
        throw new Error(`[nagi] addon "${addon.name}" is already installed`);
      }

      addon.install(addonRegistry);
      installedAddons.add(addon.name);
    },
  } satisfies AddonRegistry;

  return addonRegistry;
}

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
