import type { ComponentSetup, RefElement } from "../../types";
import type { Addon, AddonContext, MountOptions } from "../addon";
import type { DebugReporter } from "../debugEvent";

// biome-ignore lint/suspicious/noExplicitAny: return type varies with addons
type MountFn = (el: RefElement, props: Record<string, any>) => any;

type UnmountFn = (targets: RefElement[]) => Promise<void>;

export type ComponentMiddleware = <S extends ComponentSetup>(comp: S) => S;

export type MountMiddleware = (
  next: MountFn,
  setup: ComponentSetup,
  opts: MountOptions,
) => MountFn;

export type UnmountMiddleware = (next: UnmountFn) => UnmountFn;

class AddonRegistry implements AddonContext {
  #installedAddonNames = new Set<string>();
  #componentMiddlewares: ComponentMiddleware[] = [];
  #mountMiddlewares: MountMiddleware[] = [];
  #unmountMiddlewares: UnmountMiddleware[] = [];
  // component 側と参照共有するため、この配列インスタンスは作り直さない
  #debugReporters: DebugReporter[] = [];

  get installedAddons(): ReadonlySet<string> {
    return this.#installedAddonNames;
  }

  get debugReporters(): readonly DebugReporter[] {
    return this.#debugReporters;
  }

  addComponentMiddleware(middleware: ComponentMiddleware): void {
    this.#componentMiddlewares.push(middleware);
  }

  addMountMiddleware(middleware: MountMiddleware): void {
    this.#mountMiddlewares.push(middleware);
  }

  addUnmountMiddleware(middleware: UnmountMiddleware): void {
    this.#unmountMiddlewares.push(middleware);
  }

  addDebugReporter(reporter: DebugReporter): void {
    this.#debugReporters.push(reporter);
  }

  composeComponent<S extends ComponentSetup>(setup: S): S {
    return this.#componentMiddlewares.reduce(
      (s, middleware) => middleware(s),
      setup,
    );
  }

  composeMount(
    mountFn: MountFn,
    setup: ComponentSetup,
    opts: MountOptions,
  ): MountFn {
    return this.#mountMiddlewares.reduce(
      (mount, middleware) => middleware(mount, setup, opts),
      mountFn,
    );
  }

  composeUnmount(unmountFn: UnmountFn): UnmountFn {
    return this.#unmountMiddlewares.reduce(
      (unmount, middleware) => middleware(unmount),
      unmountFn,
    );
  }

  install = (addon: Addon): void => {
    if (this.#installedAddonNames.has(addon.name)) {
      throw new Error(`[nagi] addon "${addon.name}" is already installed`);
    }

    addon.install(this);
    this.#installedAddonNames.add(addon.name);
  };
}

const createAddonRegistry = () => new AddonRegistry();

/** @internal */
export { createAddonRegistry };
