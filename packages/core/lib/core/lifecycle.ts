import { LifecycleHooks } from "./_internal/component";
import { getCurrentComponent } from "./runtime";

import type {
  UseDeferredUnmountCallback,
  UseMountCallback,
  UseUnmountCallback,
} from "../types";

export const useMount = (hook: UseMountCallback) => {
  const context = getCurrentComponent(LifecycleHooks.MOUNTED);
  context[LifecycleHooks.MOUNTED].push(hook);
};

export const useUnmount = (hook: UseUnmountCallback) => {
  const context = getCurrentComponent(LifecycleHooks.UNMOUNTED);
  context[LifecycleHooks.UNMOUNTED].push(hook);
};

export const useDeferredUnmount = (hook: UseDeferredUnmountCallback) => {
  const context = getCurrentComponent(LifecycleHooks.DEFERRED_UNMOUNT);
  context[LifecycleHooks.DEFERRED_UNMOUNT].push(hook);
};
