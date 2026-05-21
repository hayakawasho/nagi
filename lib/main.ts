export { defineAddon } from "./core/addon";
export { create } from "./core/app";
export { defineComponent } from "./core/component";
export { isLifecycleError, LifecycleError } from "./core/error";
export { useMount, useUnmount } from "./core/lifecycle";
export { readonly, signal, useComputed, useWatch } from "./core/reactivity";
export { createContext, withContext } from "./hooks/createContext";
export { useDomRef } from "./hooks/useDomRef";
export { useEvent } from "./hooks/useEvent";
export { useIntersectionWatch } from "./hooks/useIntersectionWatch";
export { useMediaQuery } from "./hooks/useMediaQuery";
export { useSlot } from "./hooks/useSlot";
export { propTypes } from "./props";

export type {
  Addon,
  AddonContext,
  ComponentMiddleware,
  MountFn,
  MountMiddleware,
  MountOptions,
  UnmountFn,
  UnmountMiddleware,
} from "./core/addon";
export type { ComponentContext } from "./core/component";
export type { LifecycleErrorDetails } from "./core/error";
export type { ReadonlySignal, Signal } from "./core/reactivity";
export type { Provider } from "./hooks/createContext";
export type {
  ComponentSetup,
  Cue,
  IComponent,
  RefElement,
  SchedulePriority,
  Scheduler,
} from "./types";
