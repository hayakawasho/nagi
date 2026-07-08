import { batch, computed, effect, signal, untracked } from "@preact/signals-core";
import type { ReadonlySignal, Signal } from "@preact/signals-core";
type WatchCallback<T> = (newVal: T, oldVal: T) => void;
declare function readonly<T>(s: Signal<T>): ReadonlySignal<T>;
declare function useWatch<T>(target: Signal<T> | ReadonlySignal<T>, callback: WatchCallback<T>): void;
declare function useComputed<T>(getter: () => T): ReadonlySignal<T>;
declare function useSignalEffect(fn: () => void | (() => void)): void;
export { batch, computed, effect, readonly, signal, untracked, useComputed, useSignalEffect, useWatch, };
export type { ReadonlySignal, Signal };
