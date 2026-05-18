import { useUnmount } from "./lifecycle";

type WatchCallback<T> = (newVal: T, oldVal: T) => void;

type Unwatch = () => void;

const WATCH = Symbol("watch");

// computed の getter 実行中のみ Set。それ以外は null。Ref 単位で重複購読を防ぐ。
let currentDeps: Set<Ref<unknown>> | null = null;

class Ref<T> {
  #rawValue: T;
  #watchers = new Set<WatchCallback<T>>();

  constructor(value: T) {
    this.#rawValue = value;
  }

  get value() {
    if (currentDeps !== null) {
      currentDeps.add(this as Ref<unknown>);
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

function computed<T>(getter: () => T): ReadonlyRef<T> {
  const result = ref<T>(undefined as T);
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
    const deps = new Set<Ref<unknown>>();
    currentDeps = deps;

    let nextValue: T;
    try {
      nextValue = getter();
    } finally {
      currentDeps = prev;
    }

    // この時点で依存収集は既に終了 (currentDeps 復元済み) なので、
    // 下の result.value 代入で watcher が result.value を読んでも
    // この computed が自分自身に依存してしまうことはない。
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

export { computed, readonly, ref, useWatch };

export type { ReadonlyRef, Ref };
