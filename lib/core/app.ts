import { createPendingTasks } from "./internal/pending";
import {
  bindDOMNodeToComponent,
  DOM_COMPONENT_INSTANCE,
} from "./internal/registry";
import { createComponent } from "./runtime";

import type {
  ComponentSetup,
  RefElement,
  SchedulePriority,
  Scheduler,
} from "../types";

export function create(config: { scheduler?: Scheduler } = {}) {
  const { scheduler } = config;
  const pendingTasks = createPendingTasks();

  return {
    component(
      wrap: ComponentSetup,
      {
        priority,
      }: {
        priority?: SchedulePriority;
      } = {},
    ) {
      // biome-ignore lint/suspicious/noExplicitAny: internal props type
      return (el: RefElement, props: Record<string, any> = {}) => {
        function mount() {
          const component = createComponent(wrap, el, props);
          bindDOMNodeToComponent(el, component);
          component.onMount();

          return component;
        }

        if (!scheduler) {
          return mount();
        }

        const task = pendingTasks.add(el);

        scheduler.schedule(
          () => {
            if (!task.complete()) {
              return;
            }

            mount();
          },
          {
            priority,
            signal: task.signal,
          },
        );

        return undefined;
      };
    },

    unmount(targets: RefElement[]) {
      for (const el of targets) {
        pendingTasks.abort(el);

        const component = DOM_COMPONENT_INSTANCE.get(el);

        if (component) {
          component.onUnmount();
          DOM_COMPONENT_INSTANCE.delete(el);
        }
      }
    },
  };
}
