import type { RefElement } from "../../types";

export type PendingMount = {
  readonly signal: AbortSignal;
  complete(): boolean;
  abort(): void;
};

export type PendingMounts = {
  add(el: RefElement): PendingMount;
  abort(el: RefElement): void;
};

export function createPendingMounts(): PendingMounts {
  const tasks = new Map<RefElement, AbortController>();

  return {
    add(el) {
      const previous = tasks.get(el);

      if (previous) {
        previous.abort();
      }

      const controller = new AbortController();
      tasks.set(el, controller);

      return {
        signal: controller.signal,

        complete() {
          if (tasks.get(el) !== controller || controller.signal.aborted) {
            return false;
          }

          tasks.delete(el);
          return true;
        },

        abort() {
          if (tasks.get(el) !== controller) {
            return;
          }

          controller.abort();
          tasks.delete(el);
        },
      };
    },

    abort(el) {
      const controller = tasks.get(el);

      if (!controller) {
        return;
      }

      controller.abort();
      tasks.delete(el);
    },
  };
}
