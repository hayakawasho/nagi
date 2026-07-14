export { defineAddon } from "./core/addon";
export { create } from "./core/app";
export { defineComponent } from "./core/component";
export { createContext, withContext } from "./core/context";
export { isLifecycleError, LifecycleError } from "./core/error";
export { useDeferredUnmount, useMount, useUnmount } from "./core/lifecycle";
export { propTypes } from "./core/props";
export { useDomRef } from "./hooks/core/useDomRef";
export { useSlot } from "./hooks/core/useSlot";
export { useEvent } from "./hooks/useEvent";
export { useIntersectionWatch } from "./hooks/useIntersectionWatch";

export type { Addon, AddonContext, MountOptions } from "./core/addon";
export type { Provider } from "./core/context";
export type {
  DebugEvent,
  DebugEventLevel,
  DebugEventSource,
  DebugReporter,
} from "./core/debugEvent";
export type { LifecycleErrorDetails } from "./core/error";
export type {
  Cleanup,
  ComponentContext,
  ComponentSetup,
  Cue,
  RefElement,
  SchedulePriority,
  UseDeferredUnmountCallback,
} from "./types";
