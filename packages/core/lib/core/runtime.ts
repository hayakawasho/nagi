import { ComponentContextImpl } from "./_internal/component";
import { reportLifecycleError } from "./_internal/debugEvents";
import { isLifecycleError } from "./error";

import type { ComponentSetup, ExposedSetup, RefElement } from "../types";
import type { DebugReporter } from "./debugEvent";

// The "owner" refers to the component currently executing its setup, which is only valid during a createComponent call.
// The restoration via save/restore relies on the assumption that setup() executes synchronously.
// If setup is to be made asynchronous, the design of this module must be revisited.
let owner: ComponentContextImpl | undefined;

function getCurrentComponent(hookName: string): ComponentContextImpl {
  if (!owner) {
    throw new Error(`"${hookName}" called outside setup() will never be run.`);
  }
  return owner;
}

function createComponent<S extends ComponentSetup>(
  wrap: S,
  root: RefElement,
  // biome-ignore lint/suspicious/noExplicitAny: internal props type
  props: Record<string, any> = {},
  reporters?: readonly DebugReporter[],
): ComponentContextImpl<ReturnType<S["setup"]>> {
  const component = new ComponentContextImpl<ReturnType<S["setup"]>>(
    root,
    wrap.name,
  );
  const parent = owner;
  component.reporters = reporters ?? parent?.reporters;
  owner = component;

  try {
    if (parent) {
      component.parent = parent;
    }

    component.props = props;

    const provides = wrap.setup(root, props);
    component.current = (provides || {}) as ExposedSetup<
      ReturnType<S["setup"]>
    >;
  } catch (cause) {
    owner = parent;

    if (isLifecycleError(cause)) {
      throw cause;
    }

    throw reportLifecycleError("setup", component, cause, parent, {
      props: component.props,
    });
  }

  owner = parent;
  return component;
}

/** @internal */
export { createComponent, getCurrentComponent };
