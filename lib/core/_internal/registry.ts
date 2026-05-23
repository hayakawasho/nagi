import { LifecycleError } from "../error";

import type { RefElement } from "../../types";
import type { ComponentContextImpl } from "./component";

const DOM_COMPONENT_INSTANCE = new WeakMap<RefElement, ComponentContextImpl>();

function bindDOMNodeToComponent(
  el: RefElement,
  component: ComponentContextImpl,
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

/** @internal */
export { bindDOMNodeToComponent, DOM_COMPONENT_INSTANCE };
