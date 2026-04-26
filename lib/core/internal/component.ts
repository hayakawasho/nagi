import type {
  Cleanup,
  IComponent,
  LifecycleHandler,
  RefElement,
} from "../../types";
import { assert } from "../../util/assert";
import { LifecycleHooks } from "../lifecycle";

let owner: ComponentContext;

function setCurrentComponent(context: ComponentContext) {
  owner = context;
  return context;
}

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
  current = {} as ReturnType<IComponent<T>["setup"]>;
  props = {} as Parameters<IComponent<T>["setup"]>[1];
  element: RefElement;
  provides = new Map<symbol, unknown>();

  constructor(element: RefElement, name: string) {
    this.uid = `${name}.${uid++}`;
    this.element = element;
  }

  onMount = () => {
    const unmounts = this[LifecycleHooks.MOUNTED]
      .map((fn) => fn())
      .filter((cleanup) => typeof cleanup === "function") as Cleanup[];

    this[LifecycleHooks.UNMOUNTED].push(...unmounts);
  };

  onUnmount = () => {
    const unmounts = [
      ...this[LifecycleHooks.UNMOUNTED],
      ...this.#children.flatMap((child) => child.onUnmount),
    ];
    unmounts.forEach((fn) => {
      fn();
    });
  };

  addChild = (child: ComponentContext) => {
    this.#children.push(child);
    child.parent = this;

    child.onMount();
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

export function createComponent(wrap: IComponent) {
  const parent = owner;

  // biome-ignore lint/suspicious/noExplicitAny: internal props type
  return (root: RefElement, props: Record<string, any>) => {
    const component = new ComponentContext(root, wrap.name);

    if (parent) {
      component.parent = parent;
    }

    const context = setCurrentComponent(component);
    context.props = props || {};

    const provides = wrap.setup(root, props);
    context.current = provides || {};

    setCurrentComponent(parent);

    return context;
  };
}

export type { ComponentContext };
