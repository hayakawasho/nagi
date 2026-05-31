import { LifecycleError, type LifecycleErrorDetails } from "../error";

import type { ComponentContextImpl } from "./component";

type Phase = LifecycleErrorDetails["phase"];

const errorMessages: Record<Phase, string> = {
  setup: "[nagi] setup failed",
  mount: "[nagi] onMount hook failed",
  deferredUnmount: "[nagi] useDeferredUnmount hook failed",
  unmount: "[nagi] onUnmount cleanup failed",
  removeChild: "[nagi] removeChild failed",
};

export function errorReport(
  phase: Phase,
  target: ComponentContextImpl,
  cause: unknown,
  parent?: ComponentContextImpl | null,
) {
  console.error(
    errorMessages[phase],
    LifecycleError.create(phase, target, cause, parent),
  );
}
