import { LifecycleHooks } from "./component";
import { getCurrentComponent } from "./runtime";

import type { LifecycleHandler } from "../types";

function createHook(lifecycleType: LifecycleHooks) {
  return (hook: LifecycleHandler) => {
    const context = getCurrentComponent(lifecycleType);
    context[lifecycleType].push(hook);
  };
}

export const useMount = createHook(LifecycleHooks.MOUNTED);
export const useUnmount = createHook(LifecycleHooks.UNMOUNTED);
