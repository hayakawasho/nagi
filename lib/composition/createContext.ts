import { getCurrentComponent } from "../core/internal/component";
import type { ComponentContext, IComponent, RefElement } from "../types";

export type ContextProvider<T> = {
  readonly _id: symbol;
  readonly _factory: () => T;
}

export function createContext<T>(): [
  (factory: () => T) => ContextProvider<T>,
  () => T,
] {
  const id = Symbol();

  const provide = (factory: () => T): ContextProvider<T> => {
    return { _id: id, _factory: factory };
  };

  const use = (): T => {
    const component = getCurrentComponent("createContext.use");
    let current: ComponentContext | null = component.parent;

    while (current !== null) {
      if (current.provides.has(id)) {
        return current.provides.get(id) as T;
      }
      current = current.parent;
    }

    throw new Error("createContext.use: no provider found");
  };

  return [provide, use];
}

export function withContext<
  SetupResult extends Record<string, unknown> | void,
  Props extends Record<string, unknown>,
>(
  component: IComponent<SetupResult, Props>,
  provider: ContextProvider<unknown>,
): IComponent<SetupResult, Props> {
  return {
    name: component.name,
    setup(el: RefElement, props: Props) {
      const value = provider._factory();
      getCurrentComponent("withContext").provides.set(provider._id, value);
      return component.setup(el, props);
    },
  };
}
