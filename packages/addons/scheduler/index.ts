import { defineAddon } from "@usenagi/core";

import { createDeferredMounts } from "./_internal/deferredMounts";
import { isAbortError } from "./_internal/isAbortError";
import { createScheduler } from "./_internal/schedule";

import type { Cue, RefElement, SchedulePriority } from "@usenagi/core";

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

      const emitCueEvent = (
        phase: "pending" | "resolved" | "aborted",
        name: string,
        el: RefElement,
        cueLabel: string,
      ) => {
        ctx.emitDebugEvent({
          version: 1,
          level: "info",
          source: "scheduler",
          phase,
          name,
          element: el,
          cueLabel,
        });
      };

      ctx.addMountMiddleware((next, setup, componentOpts) => (el, props) => {
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
          const cueLabel = when.cueLabel ?? "custom";

          emitCueEvent("pending", setup.name, el, cueLabel);

          // unmount・cue エラー・再登録のどの経路の中断もここで一度だけ捕捉する
          deferredMount.signal.addEventListener(
            "abort",
            () => emitCueEvent("aborted", setup.name, el, cueLabel),
            { once: true },
          );

          when(el, deferredMount.signal).then(
            () => {
              if (!deferredMount.signal.aborted) {
                emitCueEvent("resolved", setup.name, el, cueLabel);
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
        return next(targets);
      });
    },
  });
}
