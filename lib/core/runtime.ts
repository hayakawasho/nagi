import { ComponentContext } from "./component";
import { isLifecycleError, LifecycleError } from "./error";

import type { ComponentSetup, RefElement } from "../types";

// The "owner" refers to the component currently executing its setup, which is only valid during a createComponent call.
// The restoration via save/restore relies on the assumption that setup() executes synchronously.
// If setup is to be made asynchronous, the design of this module must be revisited.
let owner: ComponentContext | undefined;

export function getCurrentComponent(hookName: string): ComponentContext {
  if (!owner) {
    throw new Error(`"${hookName}" called outside setup() will never be run.`);
  }
  return owner;
}

export function createComponent(
  wrap: ComponentSetup,
  root: RefElement,
  // biome-ignore lint/suspicious/noExplicitAny: internal props type
  props: Record<string, any> = {},
) {
  const component = new ComponentContext(root, wrap.name);
  const parent = owner;
  owner = component;

  try {
    if (parent) {
      component.parent = parent;
    }

    component.props = props;

    const provides = wrap.setup(root, props);
    component.current = provides || {};
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
