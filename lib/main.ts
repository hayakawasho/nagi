export { create } from "./core/app";
export { defineComponent } from "./core/component";
export { isLifecycleError, LifecycleError } from "./core/error";
export { useMount, useUnmount } from "./core/lifecycle";
export { readonly, ref, useWatch } from "./core/reactivity";
export { createContext, withContext } from "./hooks/createContext";
export { useDomRef } from "./hooks/useDomRef";
export { useEvent } from "./hooks/useEvent";
export { useIntersectionWatch } from "./hooks/useIntersectionWatch";
export { useMediaQuery } from "./hooks/useMediaQuery";
export { useRootRef } from "./hooks/useRootRef";
export { useSlot } from "./hooks/useSlot";

export type { ComponentContext } from "./core/component";
export type { LifecycleErrorDetails } from "./core/error";
export type { ReadonlyRef, Ref } from "./core/reactivity";
export type { Provider } from "./hooks/createContext";
export type {
  ComponentSetup,
  IComponent,
  RefElement,
  SchedulePriority,
  Scheduler,
} from "./types";
