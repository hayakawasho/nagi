import { useUnmount } from "./lifecycle";

type WatchCallback<T> = (newVal: T, oldVal: T) => void;

type Unwatch = () => void;

const WATCH = Symbol("watch");

// Set only during the execution of the useComputed getter. Null otherwise.
// Prevent duplicate subscriptions on a per-Signal basis.
let currentDeps: Set<Signal<unknown>> | null = null;

class Signal<T> {
  #rawValue: T;
  #watchers = new Set<WatchCallback<T>>();

  constructor(value: T) {
    this.#rawValue = value;
  }

  get value() {
    if (currentDeps !== null) {
      currentDeps.add(this as Signal<unknown>);
    }

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
const signal = <T = any>(val: T) => new Signal(val);

class ReadonlySignal<T> {
  #inner: Signal<T>;

  constructor(value: Signal<T>) {
    this.#inner = value;
  }

  get value() {
    return this.#inner.value;
  }

  [WATCH](callback: WatchCallback<T>) {
    return this.#inner[WATCH](callback);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: generic default
const readonly = <T = any>(s: Signal<T>) => new ReadonlySignal(s);

function watch<T>(
  target: Signal<T> | ReadonlySignal<T>,
  callback: WatchCallback<T>,
) {
  return target[WATCH](callback);
}

function useWatch<T>(
  target: Signal<T> | ReadonlySignal<T>,
  callback: WatchCallback<T>,
) {
  useUnmount(watch(target, callback));
}

function useComputed<T>(getter: () => T): ReadonlySignal<T> {
  const result = signal<T>(undefined as T);
  let unwatchers: Unwatch[] = [];

  const cleanup = () => {
    unwatchers.forEach((unwatch) => {
      unwatch();
    });
    unwatchers = [];
  };

  const reEval = () => {
    cleanup();

    const prev = currentDeps;
    const deps = new Set<Signal<unknown>>();
    currentDeps = deps;

    let nextValue: T;
    try {
      nextValue = getter();
    } finally {
      currentDeps = prev;
    }

    // At this point, dependency collection has already finished (with currentDeps restored), so
    // even if the watcher reads result.value during the assignment below,
    // this useComputed will not become dependent on itself.
    result.value = nextValue;

    for (const dep of deps) {
      unwatchers.push(
        dep[WATCH](() => {
          reEval();
        }),
      );
    }
  };

  reEval();
  useUnmount(cleanup);

  return readonly(result);
}

export { readonly, signal, useComputed, useWatch };

export type { ReadonlySignal, Signal };
