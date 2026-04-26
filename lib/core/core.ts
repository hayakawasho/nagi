import type { ComponentContext, IComponent, RefElement } from "../types";
import { createComponent } from "./internal/component";

const DOM_COMPONENT_INSTANCE = new WeakMap<RefElement, ComponentContext>();

function bindDOMNodeToComponent(
  el: RefElement,
  component: ComponentContext,
  name: string,
) {
  if (DOM_COMPONENT_INSTANCE.has(el)) {
    const report = {
      payload: {
        el,
        component,
        name,
      },
      reason: "",
    };
    throw new Error(JSON.stringify(report));
  }

  try {
    DOM_COMPONENT_INSTANCE.set(el, component);
  } catch (_error) {
    const report = {
      payload: {
        el,
        component,
        name,
      },
      reason: "",
    };
    throw new Error(JSON.stringify(report));
  }
}

export function create() {
  return {
    component(wrap: IComponent) {
      // biome-ignore lint/suspicious/noExplicitAny: internal props type
      return (el: RefElement, props: Record<string, any> = {}) => {
        const component = createComponent(wrap)(el, props);
        bindDOMNodeToComponent(el, component, wrap.name);

        component.onMount();

        return component;
      };
    },

    unmount(targets: RefElement[]) {
      targets
        .filter((el) => DOM_COMPONENT_INSTANCE.has(el))
        .forEach((el) => {
          (DOM_COMPONENT_INSTANCE.get(el) as ComponentContext).onUnmount();
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
