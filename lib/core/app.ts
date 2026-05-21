import { createAddonRegistry } from "./addon";
import {
  bindDOMNodeToComponent,
  DOM_COMPONENT_INSTANCE,
} from "./internal/registry";
import { createComponent } from "./runtime";

import type { ComponentSetup, RefElement } from "../types";
import type { Addon, MountOptions } from "./addon";
import type { ComponentContext } from "./component";

type App = {
  install(...addons: Addon[]): App;
  component<S extends ComponentSetup>(
    component: S,
    opts?: MountOptions,
  ): (
    el: RefElement,
    // biome-ignore lint/suspicious/noExplicitAny: internal props type
    props?: Record<string, any>,
  ) => ComponentContext<ReturnType<S["setup"]>> | void;
  unmount(targets: RefElement[]): void;
};

export function create(): App {
  const addonRegistry = createAddonRegistry();

  const baseUnmount = (targets: RefElement[]) => {
    for (const el of targets) {
      const component = DOM_COMPONENT_INSTANCE.get(el);

      if (component) {
        component.onUnmount();
        DOM_COMPONENT_INSTANCE.delete(el);
      }
    }
  };

  const app: App = {
    install(...addons) {
      addons.forEach(addonRegistry.install);
      return app;
    },

    component(rawComponent, opts = {}) {
      const componentSetup = addonRegistry.composeComponent(rawComponent);

      const baseMount = (el: RefElement, props: Record<string, unknown>) => {
        const component = createComponent(componentSetup, el, props);
        bindDOMNodeToComponent(el, component);
        component.onMount();

        return component;
      };

      const mount = addonRegistry.composeMount(baseMount, componentSetup, opts);

      return (el, props = {}) => mount(el, props);
    },

    unmount(targets) {
      addonRegistry.composeUnmount(baseUnmount)(targets);
    },
  };

  return app;
}
