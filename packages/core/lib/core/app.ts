import { createAddonRegistry } from "./_internal/addonRegistry";
import {
  bindDOMNodeToComponent,
  DOM_COMPONENT_INSTANCE,
} from "./_internal/registry";
import { createComponent, withAddonPipeline } from "./runtime";

import type { AddonPipeline } from "./runtime";
import type {
  ComponentContext,
  ComponentSetup,
  ExposedSetup,
  RefElement,
} from "../types";
import type { Addon, MountOptions } from "./addon";

class App {
  #addonRegistry = createAddonRegistry();

  install = (...addons: Addon[]): this => {
    addons.forEach(this.#addonRegistry.install);
    return this;
  };

  component: <S extends ComponentSetup>(
    rawComponent: S,
    opts?: MountOptions,
  ) => (
    el: RefElement,
    // biome-ignore lint/suspicious/noExplicitAny: internal props type
    props?: Record<string, any>,
  ) => ComponentContext<ExposedSetup<ReturnType<S["setup"]>>> | void = (
    rawComponent,
    opts = {},
  ) => {
    const componentSetup = this.#addonRegistry.composeComponent(rawComponent);

    const addonPipeline: AddonPipeline = {
      composeComponent: this.#addonRegistry.composeComponent.bind(this.#addonRegistry),
      composeUnmount: this.#addonRegistry.composeUnmount.bind(this.#addonRegistry),
    };

    const baseMount = (el: RefElement, props: Record<string, unknown>) => {
      return withAddonPipeline(addonPipeline, () => {
        const component = createComponent(componentSetup, el, props);
        bindDOMNodeToComponent(el, component);
        component.onMount();

        return component;
      });
    };

    const mount = this.#addonRegistry.composeMount(
      baseMount,
      componentSetup,
      opts,
    );

    return (el, props = {}) => mount(el, props);
  };

  unmount = (targets: RefElement[]): Promise<void> => {
    return Promise.resolve(
      this.#addonRegistry.composeUnmount((targets) =>
        this.#baseUnmount(targets),
      )(targets),
    );
  };

  async #baseUnmount(targets: RefElement[]): Promise<void> {
    const snapshots = targets
      .map((el) => {
        const c = DOM_COMPONENT_INSTANCE.get(el);

        if (c) {
          DOM_COMPONENT_INSTANCE.delete(el);
        }

        return c;
      })
      .filter((component) => component !== undefined);

    await Promise.all(
      snapshots.map((component) => component.onDeferredUnmount()),
    );

    for (const c of snapshots) {
      c.onUnmount();
    }
  }
}

export function create(): App {
  return new App();
}
