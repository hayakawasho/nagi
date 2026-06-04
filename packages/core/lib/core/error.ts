import type { RefElement } from "../types";
import type { ComponentContextImpl } from "./_internal/component";

export type LifecycleErrorDetails = {
  phase: "setup" | "mount" | "unmount" | "deferredUnmount" | "removeChild";
  name: string;
  uid?: string;
  path?: string;
  parentName?: string;
  parentUid?: string;
  element?: RefElement;
  props?: unknown;
  cause: unknown;
};

function traceComponentTree(context: ComponentContextImpl): string {
  const parts: string[] = [];
  let current: ComponentContextImpl | null = context;

  while (current) {
    parts.unshift(current.name);
    current = current.parent;
  }

  return parts.join(" > ");
}

export class LifecycleError extends Error {
  readonly details: LifecycleErrorDetails;

  constructor(details: LifecycleErrorDetails) {
    super(
      `[nagi] Component error in phase "${details.phase}" for "${details.name}"${details.path ? ` (${details.path})` : ""}`,
      { cause: details.cause },
    );

    this.name = "LifecycleError";
    this.details = details;
  }

  static create(
    phase: LifecycleErrorDetails["phase"],
    target: ComponentContextImpl,
    cause: unknown,
    parent: ComponentContextImpl | null | undefined = target.parent,
    extra?: Partial<LifecycleErrorDetails>,
  ): LifecycleError {
    return new LifecycleError({
      phase,
      name: target.name,
      uid: target.uid,
      path: traceComponentTree(target),
      parentName: parent?.name,
      parentUid: parent?.uid,
      element: target.element,
      cause,
      ...extra,
    });
  }
}

export function isLifecycleError(error: unknown): error is LifecycleError {
  return error instanceof LifecycleError;
}
