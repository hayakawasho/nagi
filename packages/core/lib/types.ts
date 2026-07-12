export type RefElement = HTMLElement | SVGElement;

type IsAny<T> = 0 extends 1 & T ? true : false;

/** Normalize the return value of setup to the type stored in `current` (void / undefined → empty object). */
export type ExposedSetup<T> =
  IsAny<T> extends true
    ? Record<string, unknown>
    : [T] extends [void | undefined]
      ? Record<string, never>
      : T extends Record<string, unknown>
        ? T
        : Record<string, never>;

export type ComponentSetup<
  SetupResult = void | Record<string, unknown>,
  Props extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: string;
  setup(el: RefElement, props: Readonly<Props>): SetupResult;
};

/** Mounted component instance exposed to app / hook callers. */
export type ComponentContext<
  Exposed extends Record<string, unknown> = Record<string, never>,
> = {
  readonly current: Exposed;
  readonly element: RefElement;
  readonly name: string;
};

export type Cleanup = () => void;

export type UseMountCallback = () => void | Cleanup;

export type UseDeferredUnmountCallback = () => void | Promise<void>;

export type UseUnmountCallback = () => void;

export type SchedulePriority = "user-blocking" | "user-visible" | "background";

export type Cue = ((el: RefElement, signal: AbortSignal) => Promise<void>) & {
  /** Debug 表示用のラベル(例: "visible")。挙動には影響しない */
  cueLabel?: string;
};
