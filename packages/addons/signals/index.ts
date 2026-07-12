import {
  batch,
  computed,
  effect,
  signal,
  untracked,
} from "@preact/signals-core";
import { useUnmount } from "@usenagi/core";

import type { ReadonlySignal, Signal } from "@preact/signals-core";

type WatchCallback<T> = (newVal: T, oldVal: T) => void;

function readonly<T>(s: Signal<T>): ReadonlySignal<T> {
  return computed(() => s.value);
}

function watch<T>(
  target: Signal<T> | ReadonlySignal<T>,
  callback: WatchCallback<T>,
) {
  let first = true;
  let prev: T;

  return effect(() => {
    const next = target.value;

    if (first) {
      first = false;
      prev = next;
      return;
    }

    const old = prev;
    prev = next;

    untracked(() => {
      callback(next, old);
    });
  });
}

function useWatch<T>(
  target: Signal<T> | ReadonlySignal<T>,
  callback: WatchCallback<T>,
) {
  useUnmount(watch(target, callback));
}

function useComputed<T>(getter: () => T): ReadonlySignal<T> {
  return computed(getter);
}

function useSignalEffect(fn: () => void | (() => void)) {
  const dispose = effect(fn);
  useUnmount(dispose);
}

export {
  batch,
  readonly,
  signal,
  untracked,
  useComputed,
  useSignalEffect,
  useWatch,
};

export type { ReadonlySignal, Signal };
