import { LifecycleError, type LifecycleErrorDetails } from "../error";

import type { DebugEvent, DebugReporter } from "../debugEvent";
import type { ComponentContextImpl } from "./component";

type InternalDebugReporter = (
  event: DebugEvent,
  lifecycleError: LifecycleError,
) => void;

const errorMessages: Record<LifecycleErrorDetails["phase"], string> = {
  setup: "[nagi] setup failed",
  mount: "[nagi] onMount hook failed",
  deferredUnmount: "[nagi] useDeferredUnmount hook failed",
  unmount: "[nagi] onUnmount cleanup failed",
  removeChild: "[nagi] removeChild failed",
};

const defaultReporter: InternalDebugReporter = (_event, lifecycleError) => {
  console.error(errorMessages[lifecycleError.details.phase], lifecycleError);
};

let reporter: InternalDebugReporter = defaultReporter;

export function setDebugReporter(nextReporter: DebugReporter): void {
  reporter = (event) => nextReporter(event);
}

/** @internal test-only */
export function resetDebugEvents(): void {
  reporter = defaultReporter;
}

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList)
    .map((name) => `.${name}`)
    .join("");

  return `${tag}${id}${classes}`;
}

function createDebugEvent(lifecycleError: LifecycleError): DebugEvent {
  const { details } = lifecycleError;

  return {
    version: 1,
    level: "error",
    source: "lifecycle",
    type: "error",
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

function runDebugReporter(
  event: DebugEvent,
  lifecycleError: LifecycleError,
): void {
  try {
    reporter(event, lifecycleError);
  } catch (cause) {
    console.error("[nagi] debug reporter failed", cause);
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
  const event = createDebugEvent(lifecycleError);

  runDebugReporter(event, lifecycleError);

  return lifecycleError;
}
