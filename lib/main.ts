export { defineAddon } from "./core/addon";
export { create } from "./core/app";
export { defineComponent } from "./core/component";
export { createContext, withContext } from "./core/context";
export { isLifecycleError, LifecycleError } from "./core/error";
export { useMount, useUnmount } from "./core/lifecycle";
export { propTypes } from "./core/props";
export { readonly, signal, useComputed, useWatch } from "./core/reactivity";
export { useDomRef } from "./hooks/core/useDomRef";
export { useSlot } from "./hooks/core/useSlot";
export { useEvent } from "./hooks/useEvent";
export { useIntersectionWatch } from "./hooks/useIntersectionWatch";
export { useMediaQuery } from "./hooks/useMediaQuery";

export type { Addon, AddonContext, MountOptions } from "./core/addon";
export type { Provider } from "./core/context";
export type { LifecycleErrorDetails } from "./core/error";
export type { ReadonlySignal, Signal } from "./core/reactivity";
export type {
  Cleanup,
  ComponentContext,
  ComponentSetup,
  Cue,
  RefElement,
  SchedulePriority,
} from "./types";
