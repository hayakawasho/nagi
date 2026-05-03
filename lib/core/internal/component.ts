import { assert } from "../../util/assert";
import { isLifecycleError, LifecycleError } from "../error";
import { LifecycleHooks } from "../lifecycle";

import type {
  Cleanup,
  IComponent,
  LifecycleHandler,
  RefElement,
} from "../../types";

let owner: ComponentContext;

export function getCurrentComponent(hookName: string) {
  assert(owner, `"${hookName}" called outside setup() will never be run.`);
  return owner;
}

let uid = 0;

// biome-ignore lint/suspicious/noExplicitAny: generic default
class ComponentContext<T = any> {
  private [LifecycleHooks.MOUNTED]: LifecycleHandler[] = [];
  private [LifecycleHooks.UNMOUNTED]: LifecycleHandler[] = [];

  parent: ComponentContext<T> | null = null;
  #children: ComponentContext<T>[] = [];

  readonly uid: string;
  readonly name: string;
  current = {} as ReturnType<IComponent<T>["setup"]>;
  props = {} as Parameters<IComponent<T>["setup"]>[1];
  element: RefElement;
  provides = new Map<symbol, unknown>();

  constructor(element: RefElement, name: string) {
    this.uid = `${name}.${uid++}`;
    this.name = name;
    this.element = element;
  }

  onMount = () => {
    const unmounts: Cleanup[] = [];

    this[LifecycleHooks.MOUNTED].forEach((mount) => {
      try {
        const cleanup = mount();

        if (typeof cleanup === "function") {
          unmounts.push(cleanup as Cleanup);
        }
      } catch (cause) {
        console.error(
          "[Lake] onMount hook failed",
          LifecycleError.create("mount", this, cause),
        );
      }
    });

    this[LifecycleHooks.UNMOUNTED].push(...unmounts);
  };

  onUnmount = () => {
    this[LifecycleHooks.UNMOUNTED].forEach((unmount) => {
      try {
        unmount();
      } catch (cause) {
        console.error(
          "[Lake] onUnmount cleanup failed",
          LifecycleError.create("unmount", this, cause),
        );
      }
    });

    this.#children.forEach((child) => child.onUnmount());
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
}

export function createComponent(
  wrap: IComponent,
  root: RefElement,
  // biome-ignore lint/suspicious/noExplicitAny: internal props type
  props: Record<string, any>,
) {
  const parent = owner;
  const component = new ComponentContext(root, wrap.name);

  if (parent) {
    component.parent = parent;
  }

  owner = component;
  component.props = props;

  try {
    const provides = wrap.setup(root, props);
    component.current = provides || {};
  } catch (cause) {
    if (isLifecycleError(cause)) {
      throw cause;
    }

    throw LifecycleError.create("setup", component, cause, parent, {
      props: component.props,
    });
  } finally {
    owner = parent;
  }

  return component;
}

export type { ComponentContext };
