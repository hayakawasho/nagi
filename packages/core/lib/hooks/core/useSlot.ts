import { errorReport } from "../../core/_internal/errorReport";
import {
  createComponent,
  getCurrentAddonPipeline,
  getCurrentComponent,
  withAddonPipeline,
} from "../../core/runtime";

import type { ComponentContextImpl } from "../../core/_internal/component";
import type {
  ComponentContext,
  ComponentSetup,
  ExposedSetup,
  RefElement,
} from "../../types";

export function useSlot() {
  const context = getCurrentComponent("useSlot");
  const addonPipeline = getCurrentAddonPipeline();

  return {
    addChild<Child extends ComponentSetup>(
      targetOrTargets: RefElement | RefElement[],
      child: Child,
      props?: Partial<Parameters<Child["setup"]>[1]>,
    ): ComponentContext<ExposedSetup<ReturnType<Child["setup"]>>>[] {
      const composedChild = addonPipeline
        ? addonPipeline.composeComponent(child)
        : child;

      const create = (el: RefElement) => {
        const component = withAddonPipeline(addonPipeline, () =>
          createComponent(composedChild, el, props),
        );
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
      const baseUnmount = async (_targets: RefElement[]) => {
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
      };

      const targets = children.map((c) => c.element);

      const unmount = addonPipeline
        ? addonPipeline.composeUnmount(baseUnmount)
        : baseUnmount;

      await unmount(targets);
    },
  };
}
