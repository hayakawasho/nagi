import { useUnmount } from "./lifecycle";

type WatchCallback<T> = (newVal: T, oldVal: T) => void;

type Unwatch = () => void;

const WATCH = Symbol("watch");

// computed の getter 実行中のみ有効。Ref インスタンス単位で同一依存の重複購読を防ぐ。
let activeTracker: Set<Ref<unknown>> | null = null;

class Ref<T> {
	#rawValue: T;
	#watchers = new Set<WatchCallback<T>>();

	constructor(value: T) {
		this.#rawValue = value;
	}

	get value() {
		if (activeTracker !== null) {
			activeTracker.add(this as Ref<unknown>);
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
	let unWatchers: Unwatch[] = [];

	const cleanup = () => {
		unWatchers.forEach(unwatch => unwatch());
		unWatchers = [];
	};

	const reEval = () => {
		cleanup();

		const prev = activeTracker;
		const tracker = new Set<Ref<unknown>>();
		activeTracker = tracker;

		let nextValue: T;
		try {
			nextValue = getter();
		} finally {
			activeTracker = prev;
		}

		// Tracking is already restored here, so updating the result cannot make
		// this computed depend on itself when watchers read `result.value`.
		result.value = nextValue;

		for (const dep of tracker) {
			unWatchers.push(
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
