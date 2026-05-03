import { useUnmount } from "./lifecycle";

type WatchCallback<T> = (newVal: T, oldVal: T) => void;
type Unwatch = () => void;

const WATCH = Symbol("watch");

class Ref<T> {
  #rawValue: T;
  #watchers = new Set<WatchCallback<T>>();

  constructor(value: T) {
    this.#rawValue = value;
  }

  get value() {
    return this.#rawValue;
  }

  set value(newVal: T) {
    if (Object.is(newVal, this.#rawValue)) {
      return;
    }

    const oldVal = this.#rawValue;
    this.#rawValue = newVal;

    for (const subscriber of Array.from(this.#watchers)) {
      subscriber(newVal, oldVal);
    }
  }

  [WATCH](callback: WatchCallback<T>): Unwatch {
    this.#watchers.add(callback);

    return () => {
      this.#watchers.delete(callback);
    };
  }
}

// biome-ignore lint/suspicious/noExplicitAny: generic default
const ref = <T = any>(val: T) => new Ref(val);

class ReadonlyRef<T> {
  #ref: Ref<T>;

  constructor(value: Ref<T>) {
    this.#ref = value;
  }

  get value() {
    return this.#ref.value;
  }

  [WATCH](callback: WatchCallback<T>) {
    return this.#ref[WATCH](callback);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: generic default
const readonly = <T = any>(ref: Ref<T>) => new ReadonlyRef(ref);

function watch<T>(ref: Ref<T> | ReadonlyRef<T>, callback: WatchCallback<T>) {
  return ref[WATCH](callback);
}

function useWatch<T>(ref: Ref<T> | ReadonlyRef<T>, callback: WatchCallback<T>) {
  useUnmount(watch(ref, callback));
}

export { readonly, ref, useWatch };

export type { ReadonlyRef, Ref };
