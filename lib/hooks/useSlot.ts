import { LifecycleError } from "../core/error";
import { createComponent, getCurrentComponent } from "../core/runtime";

import type { ComponentContext } from "../core/component";
import type { ComponentSetup, RefElement } from "../types";

export function useSlot() {
  const context = getCurrentComponent("useSlot");

  return {
    addChild<Child extends ComponentSetup>(
      targetOrTargets: RefElement | RefElement[],
      child: Child,
      props?: Partial<Parameters<Child["setup"]>[1]>,
    ): ComponentContext<ReturnType<Child["setup"]>>[] {
      const create = (el: RefElement) => {
        const component = createComponent(child, el, props);
        context.addChild(component);

        return component;
      };

      return Array.isArray(targetOrTargets)
        ? targetOrTargets.map((el) => create(el))
        : [create(targetOrTargets)];
    },

    removeChild(children: ComponentContext[]) {
      children.forEach((child) => {
        try {
          context.removeChild(child);
        } catch (cause) {
          console.error(
            "[nagi] removeChild failed",
            LifecycleError.create("removeChild", child, cause, context),
          );
        }
      });
    },
  };
}
