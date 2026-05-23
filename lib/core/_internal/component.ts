import { LifecycleError } from "../error";

import type {
  Cleanup,
  ComponentContext,
  ComponentSetup,
  ExposedSetup,
  LifecycleHandler,
  RefElement,
} from "../../types";

enum LifecycleHooks {
  MOUNTED = "Mounted",
  UNMOUNTED = "Unmounted",
}

let uid = 0;

// biome-ignore lint/suspicious/noExplicitAny: generic default
class ComponentContextImpl<T = any>
  implements ComponentContext<ExposedSetup<T>>
{
  private [LifecycleHooks.MOUNTED]: LifecycleHandler[] = [];
  private [LifecycleHooks.UNMOUNTED]: LifecycleHandler[] = [];

  parent: ComponentContextImpl | null = null;
  #children: ComponentContextImpl[] = [];

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
        console.error(
          "[nagi] onMount hook failed",
          LifecycleError.create("mount", this, cause),
        );
      }
    }

    this[LifecycleHooks.UNMOUNTED].push(...unmounts);
  };

  onUnmount = () => {
    for (const unmount of this[LifecycleHooks.UNMOUNTED]) {
      try {
        unmount();
      } catch (cause) {
        console.error(
          "[nagi] onUnmount cleanup failed",
          LifecycleError.create("unmount", this, cause),
        );
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

  removeChild = (child: ComponentContextImpl) => {
    const index = this.#children.indexOf(child);

    if (index === -1) {
      return;
    }

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
