import { LifecycleError } from "../error";

import type { RefElement } from "../../types";
import type { ComponentContext } from "../component";

export const DOM_COMPONENT_INSTANCE = new WeakMap<
  RefElement,
  ComponentContext
>();

export function bindDOMNodeToComponent(
  el: RefElement,
  component: ComponentContext,
) {
  const existing = DOM_COMPONENT_INSTANCE.get(el);

  if (existing) {
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
