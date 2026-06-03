import { errorReport } from "../../core/_internal/errorReport";
import { createComponent, getCurrentComponent } from "../../core/runtime";

import type { ComponentContextImpl } from "../../core/_internal/component";
import type {
  ComponentContext,
  ComponentSetup,
  ExposedSetup,
  RefElement,
} from "../../types";

export function useSlot() {
  const context = getCurrentComponent("useSlot");

  return {
    addChild<Child extends ComponentSetup>(
      targetOrTargets: RefElement | RefElement[],
      child: Child,
      props?: Partial<Parameters<Child["setup"]>[1]>,
    ): ComponentContext<ExposedSetup<ReturnType<Child["setup"]>>>[] {
      const create = (el: RefElement) => {
        const component = createComponent(child, el, props);
        context.addChild(component);

        return component;
      };

      return Array.isArray(targetOrTargets)
        ? targetOrTargets.map((el) => create(el))
        : [create(targetOrTargets)];
    },

    async removeChild(
      children: ComponentContext<Record<string, unknown>>[],
    ): Promise<void> {
      await Promise.all(
        children.map((child) =>
          context
            .removeChild(child as unknown as ComponentContextImpl)
            .catch((cause) => {
              errorReport(
                "removeChild",
                child as unknown as ComponentContextImpl,
                cause,
                context,
              );
            }),
        ),
      );
    },
  };
}
