type WatchCallback<T> = (newVal: T, oldVal: T) => void;
type Unwatch = () => void;
declare const WATCH: unique symbol;
declare class Signal<T> {
    #private;
    constructor(value: T);
    get value(): T;
    set value(newVal: T);
    [WATCH](callback: WatchCallback<T>): Unwatch;
}
declare const signal: <T = any>(val: T) => Signal<T>;
declare class ReadonlySignal<T> {
    #private;
    constructor(value: Signal<T>);
    get value(): T;
    [WATCH](callback: WatchCallback<T>): Unwatch;
}
declare const readonly: <T = any>(s: Signal<T>) => ReadonlySignal<T>;
declare function useWatch<T>(target: Signal<T> | ReadonlySignal<T>, callback: WatchCallback<T>): void;
declare function useComputed<T>(getter: () => T): ReadonlySignal<T>;
export { readonly, signal, useComputed, useWatch };
export type { ReadonlySignal, Signal };
