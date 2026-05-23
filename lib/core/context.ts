import { getCurrentComponent } from "./runtime";

import type { ComponentSetup, RefElement } from "../types";
import type { ComponentContextImpl } from "./_internal/component";

export type Provider<T> = {
  readonly _id: symbol;
  readonly _type?: T;
};

export function createContext<T>(): [Provider<T>, () => Readonly<T>] {
  const id = Symbol();
  const key: Provider<T> = { _id: id };

  const use = (): Readonly<T> => {
    const component = getCurrentComponent("createContext.use");
    let current: ComponentContextImpl | null = component;

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
): <
  SetupResult extends Record<string, unknown> | void,
  Props extends Record<string, unknown>,
>(
  component: ComponentSetup<SetupResult, Props>,
) => ComponentSetup<SetupResult, Props> {
  return (component) => ({
    name: component.name,
    setup(el: RefElement, props) {
      getCurrentComponent(`withContext.${component.name}`).provides.set(
        key._id,
        value,
      );

      return component.setup(el, props);
    },
  });
}
