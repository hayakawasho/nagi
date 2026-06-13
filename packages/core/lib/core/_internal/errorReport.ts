import { reportLifecycleError } from "./debugEvents";

import type { LifecycleErrorDetails } from "../error";
import type { ComponentContextImpl } from "./component";

type Phase = LifecycleErrorDetails["phase"];

export function errorReport(
  phase: Phase,
  target: ComponentContextImpl,
  cause: unknown,
  parent?: ComponentContextImpl | null,
) {
  reportLifecycleError(phase, target, cause, parent);
}
