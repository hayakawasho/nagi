import { LifecycleError } from "./error";
import { createComponent } from "./component";

import type { ComponentContext, IComponent, RefElement } from "../types";

const DOM_COMPONENT_INSTANCE = new WeakMap<RefElement, ComponentContext>();

function bindDOMNodeToComponent(el: RefElement, component: ComponentContext) {
  if (DOM_COMPONENT_INSTANCE.has(el)) {
    const existing = DOM_COMPONENT_INSTANCE.get(el) as ComponentContext;

    throw LifecycleError.create(
      "mount",
      component,
      new Error(
        `Component "${existing.name}" (${existing.uid}) is already mounted on this element`,
      ),
      existing,
    );
  }

  DOM_COMPONENT_INSTANCE.set(el, component);
}

export function create() {
  return {
    component(wrap: IComponent) {
      // biome-ignore lint/suspicious/noExplicitAny: internal props type
      return (el: RefElement, props: Record<string, any> = {}) => {
        const component = createComponent(wrap, el, props);
        bindDOMNodeToComponent(el, component);

        component.onMount();

        return component;
      };
    },

    unmount(targets: RefElement[]) {
      targets
        .filter((el) => DOM_COMPONENT_INSTANCE.has(el))
        .forEach((el) => {
          (DOM_COMPONENT_INSTANCE.get(el) as ComponentContext).onUnmount();
          DOM_COMPONENT_INSTANCE.delete(el);
        });
    },
  };
}

export function defineComponent<Context extends Record<string, unknown>>(): <
  SetupResult extends Record<string, unknown> | void,
>(opts: {
  name: string;
  setup(el: RefElement, context: Context): SetupResult;
}) => (context: Context) => IComponent<SetupResult>;

export function defineComponent<
  SetupResult extends Record<string, unknown> | void,
  Props extends Record<string, unknown>,
>(opts: IComponent<SetupResult, Props>): IComponent<SetupResult, Props>;

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
