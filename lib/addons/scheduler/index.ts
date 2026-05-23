import { defineAddon } from "../../core/addon";

import { createPendingMounts } from "./_internal/pending";
import { createScheduler } from "./_internal/schedule";

import type { Cue, SchedulePriority } from "../../types";

declare module "../../core/addon" {
  interface MountOptions {
    priority?: SchedulePriority;
    when?: Cue;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException || error instanceof Error) &&
    error.name === "AbortError"
  );
}

export function schedulerAddon(opts?: { priority?: SchedulePriority }) {
  return defineAddon({
    name: "@usenagi/scheduler",
    install(ctx) {
      const scheduler = createScheduler(opts);
      const pendingMounts = createPendingMounts();

      ctx.addMountMiddleware((next, _setup, componentOpts) => (el, props) => {
        const task = pendingMounts.add(el);

        const dispatch = () => {
          scheduler.schedule(
            () => {
              if (!task.complete()) {
                return;
              }

              next(el, props);
            },
            {
              priority: componentOpts.priority,
              signal: task.signal,
            },
          );
        };

        const { when } = componentOpts;

        if (when) {
          when(el, task.signal).then(
            () => {
              if (!task.signal.aborted) {
                dispatch();
              }
            },
            (reason) => {
              if (isAbortError(reason)) {
                return;
              }

              task.abort();

              queueMicrotask(() => {
                throw reason;
              });
            },
          );
        } else {
          dispatch();
        }

        return undefined;
      });

      ctx.addUnmountMiddleware((next) => (targets) => {
        targets.forEach(pendingMounts.abort);
        next(targets);
      });
    },
  });
}
