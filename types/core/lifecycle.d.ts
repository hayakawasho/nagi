import type { LifecycleHandler } from "../types";
export declare enum LifecycleHooks {
    MOUNTED = "Mounted",
    UNMOUNTED = "Unmounted"
}
export declare const useMount: (hook: LifecycleHandler) => void;
export declare const useUnmount: (hook: LifecycleHandler) => void;
//# sourceMappingURL=lifecycle.d.ts.map