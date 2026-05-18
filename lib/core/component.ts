import { LifecycleError } from "./error";

import type {
  Cleanup,
  ComponentSetup,
  LifecycleHandler,
  RefElement,
} from "../types";

export enum LifecycleHooks {
  MOUNTED = "Mounted",
  UNMOUNTED = "Unmounted",
}

let uid = 0;

// biome-ignore lint/suspicious/noExplicitAny: generic default
export class ComponentContext<T = any> {
  private [LifecycleHooks.MOUNTED]: LifecycleHandler[] = [];
  private [LifecycleHooks.UNMOUNTED]: LifecycleHandler[] = [];

  parent: ComponentContext<T> | null = null;
  #children: ComponentContext<T>[] = [];

  readonly uid: string;
  readonly name: string;
  current = {} as ReturnType<ComponentSetup<T>["setup"]>;
  props = {} as Parameters<ComponentSetup<T>["setup"]>[1];
  element: RefElement;
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

  addChild = (child: ComponentContext) => {
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

  removeChild = (child: ComponentContext) => {
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

export function defineComponent<Context extends Record<string, unknown>>(): <
  SetupResult extends Record<string, unknown> | void,
>(opts: {
  name: string;
  setup(el: RefElement, context: Context): SetupResult;
}) => (context: Context) => ComponentSetup<SetupResult>;

export function defineComponent<
  SetupResult extends Record<string, unknown> | void,
  Props extends Record<string, unknown>,
>(opts: ComponentSetup<SetupResult, Props>): ComponentSetup<SetupResult, Props>;

// biome-ignore lint/suspicious/noExplicitAny: overload implementation
export function defineComponent(opts?: any) {
  if (opts === undefined) {
    // biome-ignore lint/suspicious/noExplicitAny: overload implementation
    return (opts: any) => (context: any) => ({
      name: opts.name,
      setup(el: RefElement) {
        return opts.setup(el, context);
      },
    });
  }

  return opts;
}
