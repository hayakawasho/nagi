import { createPendingMountTasks } from "./internal/pending";
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
import type { ComponentContext } from "./component";

type AppOptions = { priority?: SchedulePriority };

type SyncApp = {
  component<S extends ComponentSetup>(
    wrap: S,
    opts?: AppOptions,
  ): (
    el: RefElement,
    // biome-ignore lint/suspicious/noExplicitAny: internal props type
    props?: Record<string, any>,
  ) => ComponentContext<ReturnType<S["setup"]>>;
  unmount(targets: RefElement[]): void;
};

type AsyncApp = {
  component<S extends ComponentSetup>(
    wrap: S,
    opts?: AppOptions,
  ): (
    el: RefElement,
    // biome-ignore lint/suspicious/noExplicitAny: internal props type
    props?: Record<string, any>,
  ) => void;
  unmount(targets: RefElement[]): void;
};

export function create(): SyncApp;
export function create(config: { scheduler?: undefined }): SyncApp;
export function create(config: { scheduler: Scheduler }): AsyncApp;
export function create(config: {
  scheduler?: Scheduler | undefined;
}): SyncApp | AsyncApp;
export function create(
  config: { scheduler?: Scheduler } = {},
): SyncApp | AsyncApp {
  const { scheduler } = config;
  const pendingMountTasks = createPendingMountTasks();

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

        const task = pendingMountTasks.add(el);

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
        pendingMountTasks.abort(el);

        const component = DOM_COMPONENT_INSTANCE.get(el);

        if (component) {
          component.onUnmount();
          DOM_COMPONENT_INSTANCE.delete(el);
        }
      }
    },
  };
}
