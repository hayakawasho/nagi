type WatchCallback<T> = (newVal: T, oldVal: T) => void;
type Unwatch = () => void;
declare const WATCH: unique symbol;
declare class Ref<T> {
    #private;
    constructor(value: T);
    get value(): T;
    set value(newVal: T);
    [WATCH](callback: WatchCallback<T>): Unwatch;
}
declare const ref: <T = any>(val: T) => Ref<T>;
declare class ReadonlyRef<T> {
    #private;
    constructor(value: Ref<T>);
    get value(): T;
    [WATCH](callback: WatchCallback<T>): Unwatch;
}
declare const readonly: <T = any>(ref: Ref<T>) => ReadonlyRef<T>;
declare function useWatch<T>(ref: Ref<T> | ReadonlyRef<T>, callback: WatchCallback<T>): void;
declare function computed<T>(getter: () => T): ReadonlyRef<T>;
export { computed, readonly, ref, useWatch };
export type { ReadonlyRef, Ref };
