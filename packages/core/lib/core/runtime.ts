import { ComponentContextImpl } from "./_internal/component";
import { isLifecycleError, LifecycleError } from "./error";

import type { ComponentSetup, ExposedSetup, RefElement } from "../types";

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
): ComponentContextImpl<ReturnType<S["setup"]>> {
  const component = new ComponentContextImpl<ReturnType<S["setup"]>>(
    root,
    wrap.name,
  );
  const parent = owner;
  owner = component;

  try {
    if (parent) {
      component.parent = parent;
    }

    component.props = props;

    const provides = wrap.setup(root, props);

    if (
      provides !== null &&
      typeof provides === "object" &&
      typeof (provides as unknown as PromiseLike<unknown>).then === "function"
    ) {
      throw new Error(
        `"${wrap.name}" setup() must be synchronous. Hooks registered after "await" would be bound to the wrong component.`,
      );
    }

    component.current = (provides || {}) as ExposedSetup<
      ReturnType<S["setup"]>
    >;
  } catch (cause) {
    owner = parent;

    if (isLifecycleError(cause)) {
      throw cause;
    }

    throw LifecycleError.create("setup", component, cause, parent, {
      props: component.props,
    });
  }

  owner = parent;
  return component;
}

/** @internal */
export { createComponent, getCurrentComponent };
