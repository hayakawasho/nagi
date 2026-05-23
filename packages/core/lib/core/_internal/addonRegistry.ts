import type { ComponentSetup } from "../../types";
import type {
  Addon,
  AddonContext,
  ComponentMiddleware,
  MountFn,
  MountMiddleware,
  MountOptions,
  UnmountFn,
  UnmountMiddleware,
} from "../addon";

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

function createAddonRegistry(): AddonRegistry {
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

/** @internal */
export { createAddonRegistry };
