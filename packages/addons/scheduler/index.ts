import { defineAddon } from "@usenagi/core";

import { createDeferredMounts } from "./_internal/deferredMounts";
import { isAbortError } from "./_internal/isAbortError";
import { createScheduler } from "./_internal/schedule";

import type { Cue, SchedulePriority } from "@usenagi/core";

declare module "@usenagi/core" {
  interface MountOptions {
    priority?: SchedulePriority;
    when?: Cue;
  }
}

export function schedulerAddon(opts?: { priority?: SchedulePriority }) {
  return defineAddon({
    name: "@usenagi/scheduler",
    install(ctx) {
      const scheduler = createScheduler(opts);
      const deferredMounts = createDeferredMounts();

      ctx.addMountMiddleware((next, _setup, componentOpts) => (el, props) => {
        const deferredMount = deferredMounts.add(el);

        const dispatch = () => {
          scheduler.schedule(
            () => {
              if (!deferredMount.complete()) {
                return;
              }

              next(el, props);
            },
            {
              priority: componentOpts.priority,
              signal: deferredMount.signal,
            },
          );
        };

        const { when } = componentOpts;

        if (when) {
          when(el, deferredMount.signal).then(
            () => {
              if (!deferredMount.signal.aborted) {
                dispatch();
              }
            },
            (reason) => {
              if (isAbortError(reason)) {
                return;
              }

              deferredMount.abort();

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
        targets.forEach(deferredMounts.abort);
        next(targets);
      });
    },
  });
}
