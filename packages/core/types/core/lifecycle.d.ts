import type { UseDeferredUnmountCallback, UseMountCallback, UseUnmountCallback } from "../types";
export declare const useMount: (hook: UseMountCallback) => void;
export declare const useUnmount: (hook: UseUnmountCallback) => void;
export declare const useDeferredUnmount: (hook: UseDeferredUnmountCallback) => void;
