import { ComponentContext } from "./component";
import { isLifecycleError, LifecycleError } from "./error";

import type { ComponentSetup, RefElement } from "../types";

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
  props: Record<string, any>,
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
