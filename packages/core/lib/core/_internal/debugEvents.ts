import { LifecycleError, type LifecycleErrorDetails } from "../error";

import type {
  DebugErrorEvent,
  DebugEvent,
  DebugReporter,
} from "../debugEvent";
import type { ComponentContextImpl } from "./component";

const errorMessages: Record<LifecycleErrorDetails["phase"], string> = {
  setup: "[nagi] setup failed",
  mount: "[nagi] onMount hook failed",
  deferredUnmount: "[nagi] useDeferredUnmount hook failed",
  unmount: "[nagi] onUnmount cleanup failed",
  removeChild: "[nagi] removeChild failed",
};

function defaultReport(lifecycleError: LifecycleError): void {
  console.error(errorMessages[lifecycleError.details.phase], lifecycleError);
}

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList)
    .map((name) => `.${name}`)
    .join("");

  return `${tag}${id}${classes}`;
}

function createDebugEvent(lifecycleError: LifecycleError): DebugErrorEvent {
  const { details } = lifecycleError;

  return {
    version: 1,
    level: "error",
    source: "lifecycle",
    phase: details.phase,
    name: details.name,
    uid: details.uid,
    path: details.path,
    parentUid: details.parentUid,
    element: details.element,
    elementLabel: details.element
      ? describeElement(details.element)
      : undefined,
    props: details.props,
    cause: details.cause,
  };
}

export function dispatchDebugEvent(
  reporters: readonly DebugReporter[] | undefined,
  event: DebugEvent,
): void {
  if (!reporters || reporters.length === 0) {
    return;
  }

  for (const reporter of reporters) {
    try {
      reporter(event);
    } catch (cause) {
      console.error("[nagi] debug reporter failed", cause);
    }
  }
}

export function reportLifecycleError(
  phase: LifecycleErrorDetails["phase"],
  target: ComponentContextImpl,
  cause: unknown,
  parent?: ComponentContextImpl | null,
  extra?: Partial<LifecycleErrorDetails>,
): LifecycleError {
  const lifecycleError = LifecycleError.create(
    phase,
    target,
    cause,
    parent,
    extra,
  );

  const reporters: readonly DebugReporter[] | undefined = target.reporters;

  if (!reporters || reporters.length === 0) {
    defaultReport(lifecycleError);
    return lifecycleError;
  }

  dispatchDebugEvent(reporters, createDebugEvent(lifecycleError));

  return lifecycleError;
}

// error と違い reporter 未登録なら完全に無音(イベント構築もしない)
export function reportLifecycleInfo(
  phase: "mount" | "unmount",
  target: ComponentContextImpl,
): void {
  const reporters: readonly DebugReporter[] | undefined = target.reporters;

  if (!reporters || reporters.length === 0) {
    return;
  }

  dispatchDebugEvent(reporters, {
    version: 1,
    level: "info",
    source: "lifecycle",
    phase,
    name: target.name,
    uid: target.uid,
    parentUid: target.parent?.uid,
    element: target.element,
    elementLabel: describeElement(target.element),
  });
}

/** @internal */
export { describeElement };
