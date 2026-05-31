import { errorReport } from "./errorReporter";

import type {
  Cleanup,
  ComponentContext,
  ComponentSetup,
  ExposedSetup,
  RefElement,
  UseDeferredUnmountCallback,
  UseMountCallback,
  UseUnmountCallback,
} from "../../types";

enum LifecycleHooks {
  MOUNTED = "mount",
  UNMOUNTED = "unmount",
  DEFERRED_UNMOUNT = "deferredUnmount",
}

let uid = 0;

// biome-ignore lint/suspicious/noExplicitAny: generic default
class ComponentContextImpl<T = any>
  implements ComponentContext<ExposedSetup<T>>
{
  private [LifecycleHooks.MOUNTED]: UseMountCallback[] = [];
  private [LifecycleHooks.UNMOUNTED]: UseUnmountCallback[] = [];
  private [LifecycleHooks.DEFERRED_UNMOUNT]: UseDeferredUnmountCallback[] = [];

  parent: ComponentContextImpl | null = null;
  #children: ComponentContextImpl[] = [];

  #deferredUnmountPromise: Promise<void> | null = null;

  readonly uid: string;
  readonly name: ComponentContext["name"];
  current = {} as ExposedSetup<T>;
  props = {} as Parameters<ComponentSetup<T>["setup"]>[1];
  element: ComponentContext["element"];
  provides = new Map<symbol, unknown>();

  constructor(element: RefElement, name: string) {
    this.uid = `${name}.${uid++}`;
    this.name = name;
    this.element = element;
  }

  onMount = () => {
    const unmounts: Cleanup[] = [];

    for (const mount of this[LifecycleHooks.MOUNTED]) {
      try {
        const cleanup = mount();

        if (typeof cleanup === "function") {
          unmounts.push(cleanup as Cleanup);
        }
      } catch (cause) {
        errorReport("mount", this, cause);
      }
    }

    this[LifecycleHooks.UNMOUNTED].push(...unmounts);
  };

  onDeferredUnmount = (): Promise<void> => {
    if (this.#deferredUnmountPromise) {
      return this.#deferredUnmountPromise;
    }

    this.#deferredUnmountPromise = Promise.all([
      ...this[LifecycleHooks.DEFERRED_UNMOUNT].map(async (fn) => {
        try {
          await fn();
        } catch (cause) {
          errorReport("deferredUnmount", this, cause);
        }
      }),
      ...this.#children.map((c) => c.onDeferredUnmount()),
    ]).then(() => {
      //
    });

    return this.#deferredUnmountPromise;
  };

  onUnmount = () => {
    for (const unmount of this[LifecycleHooks.UNMOUNTED]) {
      try {
        unmount();
      } catch (cause) {
        errorReport("unmount", this, cause);
      }
    }

    for (const child of this.#children) {
      child.onUnmount();
    }
  };

  addChild = (child: ComponentContextImpl) => {
    this.#children.push(child);
    child.parent = this;

    try {
      child.onMount();
    } catch (e) {
      const index = this.#children.indexOf(child);

      if (index !== -1) {
        this.#children.splice(index, 1);
      }

      child.parent = null;
      throw e;
    }
  };

  removeChild = async (child: ComponentContextImpl): Promise<void> => {
    const index = this.#children.indexOf(child);

    if (index === -1) {
      return;
    }

    await child.onDeferredUnmount();

    this.#children.splice(index, 1);
    child.parent = null;
    child.onUnmount();
  };

  get childElements(): RefElement[] {
    return this.#children.map((c) => c.element);
  }
}

/** @internal */
export { ComponentContextImpl, LifecycleHooks };
