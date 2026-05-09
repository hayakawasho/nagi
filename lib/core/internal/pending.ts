import type { RefElement } from "../../types";

type Stored = { controller: AbortController };

export type PendingTask = {
  readonly signal: AbortSignal;
  complete(): boolean;
  abort(): void;
};

export type PendingTasks = {
  add(el: RefElement): PendingTask;
  abort(el: RefElement): void;
};

export function createPendingTasks(): PendingTasks {
  const tasks = new Map<RefElement, Stored>();

  return {
    add(el) {
      const previous = tasks.get(el);

      if (previous) {
        previous.controller.abort();
      }

      const controller = new AbortController();
      const stored: Stored = { controller };
      tasks.set(el, stored);

      return {
        signal: controller.signal,

        complete() {
          if (
            tasks.get(el)?.controller !== controller ||
            controller.signal.aborted
          ) {
            return false;
          }

          tasks.delete(el);
          return true;
        },

        abort() {
          if (tasks.get(el)?.controller !== controller) {
            return;
          }

          controller.abort();
          tasks.delete(el);
        },
      };
    },

    abort(el) {
      const stored = tasks.get(el);

      if (!stored) {
        return;
      }

      stored.controller.abort();
      tasks.delete(el);
    },
  };
}
