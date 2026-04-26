import { getCurrentComponent } from "../core/internal/component";
import type { ComponentContext, IComponent, RefElement } from "../types";

export type Provider<T> = {
  readonly _id: symbol;
  readonly _type?: T;
}

export function createContext<T>(): [Provider<T>, () => Readonly<T>] {
  const id = Symbol();

  const key: Provider<T> = { _id: id };

  const use = (): Readonly<T> => {
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

  return [key, use] as const;
}

export function withContext<T>(
  key: Provider<T>,
  value: T,
): <SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(
  component: IComponent<SetupResult, Props>,
) => IComponent<SetupResult, Props> {
  return (component) => ({
    name: component.name,
    setup(el: RefElement, props) {
      getCurrentComponent(`withContext.${component.name}`).provides.set(key._id, value);

      return component.setup(el, props);
    },
  });
}
